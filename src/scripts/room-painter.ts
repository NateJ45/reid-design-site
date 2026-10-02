// Foundation, edit with care
// =============================================================================
// room-painter: the concept room's WebGL renderer (added 2026-09-30; whole
// frames, manifest v3, the same day)
// =============================================================================
// Hand-written WebGL1, no library. Loaded with a dynamic import() by the
// RoomStage script only when the section is about a screen away, so it costs
// the home page nothing up front. Budget: under 7 KB gzipped (measured from
// the build; see docs/agent/performance.md).
//
// WHAT IT DRAWS. Every step of the room's build is one COMPLETE photo (a
// "frame"). The canvas shows one frame, A, and while pieces arrive, up to two
// more: B and C, each the complete room with one more piece. The shader paints
// the walls of EACH frame with that frame's own wall mask, then mixes:
//
//   out = mix(mix(painted A, painted B', revealB), painted C', revealC)
//   reveal = change(uv') * r(t)
//
// `change` is the frame's greyscale "where I differ from the frame before"
// mask, so outside it A shows untouched and nothing can pop. r(t) is a soft,
// noisy front shaped by the piece's motion (sweep/unroll wipe along the box's
// long axis, drop falls from the top of the box, rise comes up from the
// bottom, slide comes in from its side, pop grows from the box centre), and
// B' is B sampled at uv' = uv + offset * (1 - ease(t)): the settle into place
// (slide ~2.5% of the frame across, drop/rise ~2% down/up, pop 97% to 100%
// round the box centre). Each piece takes 750ms, eased
// cubic-bezier(0.23, 1, 0.32, 1). When B lands it BECOMES A (its textures are
// kept, never re-uploaded) and C becomes B.
//
// THE PAINT keeps the photo's own light and shadow. All maths in linear light:
//   shade   = luma(px) / luma(median)
//   tint    = mix(1, (px / luma(px)) / (median / luma(median)), 0.35)
//   painted = chip * shade * tint
//   out     = mix(px, painted, wall * paintAmount)
// `median` is ONE wall median for the whole room (manifest), so the paint is
// identical from frame to frame. A chip change rolls the new colour on from
// the left with a noisy front (~900ms), over whatever frames are showing.
//
// SCHEDULING (go(frame)): going forward queues every frame up to the target
// and plays them one after another; pieces of the SAME stage overlap, each
// starting 45% into the one before (two may be in flight: a third lands the
// oldest, which by then is ~90% done and visually home). Going back lands
// whatever is in flight and crossfades straight to the target in 200ms, no
// reverse animation. A piece never starts before its frame, wall and change
// have decoded; until then the room holds on what it shows. Reduced motion:
// every change is an instant swap, and so is a chip. The rAF loop runs only
// while something moves and stops dead when it lands.
//
// Textures: the page's own frame <img>s (whatever currentSrc their <picture>
// chose), so the painter downloads no photo the page does not; the masks are
// fetched as Image()s, same origin (CSP img-src 'self'), no workers, no blobs.
// Three texture sets (frame, wall, change) are made once and reused for the
// life of the painter, and setRoom() swaps rooms in the SAME context, so
// switching rooms never creates a GL context (tests/room-story.spec.ts counts
// them). The chip in force carries over.
//
// Failure: createRoomPainter() returns null when there is no WebGL or a shader
// fails to compile; `onLost` fires if the context is lost later. Either way
// RoomStage falls back to crossfading the <img> stack and hides the chips.
// =============================================================================

export interface PainterFrame {
  /** Arms and decodes this frame's <img> (memoised by the caller). */
  load(): Promise<HTMLImageElement>;
  /** URL of the frame's wall mask. */
  wall: string;
  /** URL of the frame's change mask, or null (frame 0). */
  change: string | null;
  /** The change's box as fractions [x, y, w, h], or null (frame 0). */
  box: [number, number, number, number] | null;
  /** Index into ROOM_MOTIONS, or -1 (frame 0). */
  motion: number;
  /** Stage (caption) index, or -1 (frame 0). */
  stage: number;
}

export interface PainterRoom {
  frames: PainterFrame[];
  /** The room's one wall median, linear light. */
  median: [number, number, number];
  /** width / height of the frames. */
  aspect: number;
}

export interface RoomPainter {
  /** Paint the walls this colour (linear rgb), or null for "As it is". */
  setChip(linear: [number, number, number] | null): void;
  /** Show this frame: play forward to it, or crossfade back to it. */
  go(frame: number): void;
  /**
   * Switch to another room (the room tabs) in the SAME GL context, showing
   * `frame` at once. Resolves true once drawn, false if its pictures failed,
   * or null if a later setRoom() superseded it.
   */
  setRoom(room: PainterRoom, frame: number): Promise<boolean | null>;
  /** Tear everything down (also frees the GL context). */
  destroy(): void;
}

export interface PainterOptions {
  reducedMotion: boolean;
  /** Called once, after the first successful draw. */
  onReady?: () => void;
  /** Called if the GL context is lost; the painter is dead after this. */
  onLost?: () => void;
}

// v runs 0..1 from the TOP left, the same way the images do (no Y flip).
const VERT = `attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x,-p.y)*.5+.5;gl_Position=vec4(p,0.,1.);}`;

// Fragment shader. Names are short on purpose (it ships as a string).
// Motions: 0 sweep, 1 unroll, 2 slide-left, 3 slide-right, 4 rise, 5 drop,
// 6 pop (ROOM_MOTIONS order), 7 plain crossfade (going back), <0 idle slot.
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;
uniform sampler2D fA,wA,fB,wB,cB,fC,wC,cC;
uniform vec3 d,cO,cN;
uniform float pO,pN,tC,ar;
uniform vec4 bB,bC;
uniform vec2 kB,kC;
float rl;
float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 q){vec2 i=floor(q),g=fract(q);g=g*g*(3.-2.*g);
return mix(mix(h(i),h(i+vec2(1,0)),g.x),mix(h(i+vec2(0,1)),h(i+1.),g.x),g.y);}
vec3 lin(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));}
vec3 srgb(vec3 c){c=clamp(c,0.,1.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
float lu(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 paint(vec3 px,vec3 ch){
  float l=max(lu(px),1e-4),lm=max(lu(d),1e-4);
  return ch*(l/lm)*mix(vec3(1.),(px/l)/(d/lm),.35);}
vec3 col(sampler2D f,sampler2D w,vec2 q){
  vec3 px=lin(texture2D(f,q).rgb);float m=texture2D(w,q).r;
  return mix(mix(px,paint(px,cO),m*pO),mix(px,paint(px,cN),m*pN),rl);}
vec3 rev(vec4 b,vec2 k,sampler2D c){
  float e=k.x,m=k.y,u=1.-e,s,g=.07,a=.2;
  if(m<0.)return vec3(v,0.);
  if(m>6.5)return vec3(v,e);
  vec2 q=v,z=(v-b.xy)/b.zw,o=b.xy+b.zw*.5;
  if(m<1.5){s=b.z*ar>b.w?z.x:z.y;g=m<.5?.12:.05;}
  else if(m<2.5){s=1.-z.x;q.x-=.025*u;}
  else if(m<3.5){s=z.x;q.x+=.025*u;}
  else if(m<4.5){s=1.-z.y;q.y-=.02*u;}
  else if(m<5.5){s=z.y;q.y+=.02*u;}
  else{s=length(v-o)/length(b.zw*.5);q=o+(v-o)/(1.-.03*u);}
  float f=mix(-a*.5-g,1.+a*.5+g,e);
  return vec3(q,(1.-smoothstep(f-g,f+g,s+(n(v*vec2(ar,1.)*16.)-.5)*a))*texture2D(c,q).r);}
void main(){
  float fr=tC*1.3-.15;
  rl=1.-smoothstep(fr-.025,fr+.025,v.x+(n(vec2(v.y*9.,tC*3.))-.5)*.16);
  vec3 o=col(fA,wA,v),r=rev(bB,kB,cB);
  if(r.z>0.)o=mix(o,col(fB,wB,r.xy),r.z);
  r=rev(bC,kC,cC);
  if(r.z>0.)o=mix(o,col(fC,wC,r.xy),r.z);
  gl_FragColor=vec4(srgb(o),1.);}`;

/** cubic-bezier(0.23, 1, 0.32, 1) as y(x), solved by bisection. */
function ease(x: number): number {
  const bz = (t: number, a: number, b: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 20; k++) {
    const mid = (lo + hi) / 2;
    if (bz(mid, 0.23, 0.32) < x) lo = mid;
    else hi = mid;
  }
  return bz((lo + hi) / 2, 1, 1);
}

const PIECE_MS = 750;
const BACK_MS = 200;
const CHIP_MS = 900;
/** A piece of the same stage starts this far into the one before it. */
const LAP = 0.45;
const FADE = 7;

type Rgb = [number, number, number];
/** One frame's textures: photo, wall mask, change mask. */
type Tex = [WebGLTexture, WebGLTexture, WebGLTexture];
interface Assets {
  img: HTMLImageElement;
  wall: HTMLImageElement;
  change: HTMLImageElement | null;
}
/** A frame arriving: its textures, index, start time, length and motion. */
interface Slot {
  tex: Tex;
  n: number;
  t0: number;
  ms: number;
  m: number;
}

const mask = (url: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = url;
  });

export function createRoomPainter(
  canvas: HTMLCanvasElement,
  first: PainterRoom,
  start: number,
  opts: PainterOptions,
): RoomPainter | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      // Kept so the canvas can be read back (tests). It redraws rarely.
      preserveDrawingBuffer: true,
    }) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const g = gl;

  const compile = (type: number, src: string) => {
    const sh = g.createShader(type);
    if (!sh) return null;
    g.shaderSource(sh, src);
    g.compileShader(sh);
    return g.getShaderParameter(sh, g.COMPILE_STATUS) ? sh : null;
  };
  const vs = compile(g.VERTEX_SHADER, VERT);
  const fs = compile(g.FRAGMENT_SHADER, FRAG);
  const prog = g.createProgram();
  if (!vs || !fs || !prog) return null;
  g.attachShader(prog, vs);
  g.attachShader(prog, fs);
  g.linkProgram(prog);
  if (!g.getProgramParameter(prog, g.LINK_STATUS)) return null;
  g.useProgram(prog);

  // One full-screen quad.
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const loc = g.getAttribLocation(prog, 'p');
  g.enableVertexAttribArray(loc);
  g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);

  const u = (name: string) => g.getUniformLocation(prog, name);
  // Sampler units, in texture-bind order: A (frame, wall), B (frame, wall,
  // change), C (frame, wall, change).
  ['fA', 'wA', 'fB', 'wB', 'cB', 'fC', 'wC', 'cC'].forEach((s, i) => g.uniform1i(u(s), i));
  const U = {
    d: u('d'),
    cO: u('cO'),
    cN: u('cN'),
    pO: u('pO'),
    pN: u('pN'),
    tC: u('tC'),
    ar: u('ar'),
    b: [u('bB'), u('bC')],
    k: [u('kB'), u('kC')],
  };

  g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // Keep the photo's own bytes: the colour maths is done in the shader.
  g.pixelStorei(g.UNPACK_COLORSPACE_CONVERSION_WEBGL, g.NONE);

  // Three texture sets for the life of the painter: A's, and one per frame
  // in flight. Non-power-of-two in WebGL1: clamp, linear, no mipmaps. Each
  // starts as one black pixel so no sampler ever reads an empty texture.
  const texture = () => {
    const t = g.createTexture() as WebGLTexture;
    g.bindTexture(g.TEXTURE_2D, t);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGB, 1, 1, 0, g.RGB, g.UNSIGNED_BYTE, new Uint8Array(3));
    return t;
  };
  const pool: Tex[] = [0, 1, 2].map(() => [texture(), texture(), texture()]);
  const put = (t: WebGLTexture, format: number, src: TexImageSource) => {
    g.bindTexture(g.TEXTURE_2D, t);
    g.texImage2D(g.TEXTURE_2D, 0, format, format, g.UNSIGNED_BYTE, src);
  };
  const upload = (tex: Tex, a: Assets) => {
    put(tex[0], g.RGB, a.img);
    put(tex[1], g.LUMINANCE, a.wall);
    if (a.change) put(tex[2], g.LUMINANCE, a.change);
  };

  // ---- state ---------------------------------------------------------------
  let room = first;
  let dead = false;
  let ready = false;
  let loaded = false; // A holds a frame of `room`
  let raf = 0;
  let generation = 0;
  let cache: Promise<Assets>[] = [];
  let got: (Assets | undefined)[] = [];
  let A: { tex: Tex; n: number } = { tex: pool[0], n: 0 };
  let act: Slot[] = [];
  let queue: number[] = [];
  let backTo = -1;
  let goal = start;
  // The chip roll.
  let chipOld: Rgb = [1, 1, 1];
  let chipNew: Rgb = [1, 1, 1];
  let paintOld = 0;
  let paintNew = 0;
  let chipT = 0;
  let chipStart = 0;
  let busy = false;

  /** A frame's photo and masks, decoded; memoised per room. */
  const need = (n: number): Promise<Assets> => {
    if (!cache[n]) {
      const f = room.frames[n];
      const mine = generation;
      cache[n] = Promise.all([f.load(), mask(f.wall), f.change ? mask(f.change) : null]).then(
        ([img, wall, change]) => {
          const a = { img, wall, change };
          if (mine === generation) got[n] = a;
          return a;
        },
      );
      cache[n].catch(() => {});
    }
    return cache[n];
  };

  const draw = (now = performance.now()) => {
    if (dead || !loaded) return;
    g.viewport(0, 0, canvas.width, canvas.height);
    g.uniform3fv(U.cO, chipOld);
    g.uniform3fv(U.cN, chipNew);
    g.uniform1f(U.pO, paintOld);
    g.uniform1f(U.pN, paintNew);
    g.uniform1f(U.tC, busy ? ease(chipT) : 0);
    // Bind A, then each slot (an idle slot re-binds A and is switched off).
    const bound = [...A.tex.slice(0, 2)];
    for (let i = 0; i < 2; i++) {
      const s = act[i];
      bound.push(...(s ? s.tex : A.tex));
      const box = s ? (room.frames[s.n].box ?? [0, 0, 1, 1]) : [0, 0, 1, 1];
      g.uniform4fv(U.b[i], box);
      g.uniform2f(U.k[i], s ? ease(Math.min(1, (now - s.t0) / s.ms)) : 0, s ? s.m : -1);
    }
    bound.forEach((t, i) => {
      g.activeTexture(g.TEXTURE0 + i);
      g.bindTexture(g.TEXTURE_2D, t);
    });
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    if (!ready) {
      ready = true;
      opts.onReady?.();
    }
  };

  /** The oldest frame in flight lands: it becomes A (textures and all). */
  const land = () => {
    const s = act.shift();
    if (s) A = { tex: s.tex, n: s.n };
  };
  const free = () => pool.find((t) => t !== A.tex && !act.some((s) => s.tex === t)) as Tex;
  /** Put frame n straight into A (reduced motion, a new room). */
  const setA = (n: number) => {
    const tex = free();
    upload(tex, got[n] as Assets);
    A = { tex, n };
  };
  const begin = (n: number, m: number, ms: number, now: number) => {
    const tex = free();
    upload(tex, got[n] as Assets);
    act.push({ tex, n, t0: now, ms, m });
  };
  const kick = () => {
    if (!raf && (act.length || busy)) raf = requestAnimationFrame(tick);
  };
  /** Start whatever may start now; wait (holding the picture) for what has not decoded. */
  const pump = () => {
    if (dead || !loaded) return;
    const later = (n: number) => void need(n).then(pump, () => {});
    const now = performance.now();
    if (opts.reducedMotion) {
      const n = backTo >= 0 ? backTo : queue.length ? queue[queue.length - 1] : -1;
      if (n < 0) return;
      if (!got[n]) return later(n);
      backTo = -1;
      queue = [];
      setA(n);
      draw(now);
      return;
    }
    if (backTo >= 0) {
      if (!got[backTo]) return later(backTo);
      begin(backTo, FADE, BACK_MS, now);
      backTo = -1;
    }
    while (queue.length) {
      const n = queue[0];
      if (!got[n]) {
        later(n);
        break;
      }
      const last = act[act.length - 1];
      if (last) {
        const same = last.m !== FADE && room.frames[n].stage === room.frames[last.n].stage;
        if (!same || now - last.t0 < LAP * last.ms) break;
        if (act.length === 2) land();
      }
      queue.shift();
      begin(n, room.frames[n].motion, PIECE_MS, now);
    }
    kick();
  };
  const settle = () => {
    busy = false;
    chipT = 0;
    chipOld = chipNew;
    paintOld = paintNew;
  };
  function tick(now: number) {
    raf = 0;
    if (dead) return;
    while (act.length && now - act[0].t0 >= act[0].ms) land();
    if (busy) {
      chipT = Math.min(1, (now - chipStart) / CHIP_MS);
      if (chipT >= 1) settle();
    }
    pump();
    draw(now);
    kick();
  }

  // ---- sizing --------------------------------------------------------------
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    // Hidden (display: none): nothing to measure; the observer fires again
    // when it shows.
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.min(2048, Math.round(r.width * dpr)));
    const h = Math.max(1, Math.min(2048, Math.round(r.height * dpr)));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      draw();
    }
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const lost = (e: Event) => {
    e.preventDefault();
    if (dead) return;
    dead = true;
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    opts.onLost?.();
  };
  canvas.addEventListener('webglcontextlost', lost);

  // ---- rooms -----------------------------------------------------------------
  const setRoom = (r: PainterRoom, frame: number): Promise<boolean | null> => {
    const mine = ++generation;
    room = r;
    cache = [];
    got = [];
    act = [];
    queue = [];
    backTo = -1;
    loaded = false;
    goal = frame;
    if (busy) settle();
    g.uniform3fv(U.d, r.median);
    g.uniform1f(U.ar, r.aspect);
    return need(frame)
      .then(() => {
        if (dead) return false;
        if (mine !== generation) return null;
        setA(frame);
        loaded = true;
        resize();
        draw();
        // Decode the rest in build order, so a piece is ready when its turn comes.
        void r.frames.reduce<Promise<unknown>>(
          (p, _, i) => p.then(() => (mine === generation ? need(i).catch(() => {}) : null)),
          Promise.resolve(),
        );
        api.go(goal);
        return true;
      })
      .catch(() => (dead || mine === generation ? false : null));
    /* On failure the <img> stack stays in charge and the chips stay hidden. */
  };

  const api: RoomPainter = {
    setChip(linear) {
      if (dead) return;
      // Finish a roll in progress first, so the new one starts from what shows.
      if (busy) settle();
      chipNew = linear ?? chipOld;
      paintNew = linear ? 1 : 0;
      if (opts.reducedMotion || !loaded) {
        settle();
        draw();
        return;
      }
      busy = true;
      chipT = 0;
      chipStart = performance.now();
      kick();
    },
    go(frame) {
      goal = frame;
      if (dead || !loaded) return;
      const top = queue.length ? queue[queue.length - 1] : act.length ? act[act.length - 1].n : A.n;
      if (frame > top) {
        // Forward again before a pending crossfade back began: drop it, and
        // build on from what shows (every reveal is over the frame before it).
        backTo = -1;
        for (let n = top + 1; n <= frame; n++) queue.push(n);
      } else {
        queue = queue.filter((n) => n <= frame);
        const shown = act.length ? act[act.length - 1].n : A.n;
        if (frame < shown || backTo >= 0) {
          // Back: land what is in flight, then a quick plain crossfade.
          while (act.length) land();
          queue = [];
          backTo = frame === A.n ? -1 : frame;
          draw();
        }
      }
      pump();
    },
    setRoom,
    destroy() {
      if (dead) return;
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      g.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
  void setRoom(first, start);
  return api;
}
