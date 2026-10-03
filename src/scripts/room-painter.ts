// Foundation, edit with care
// =============================================================================
// room-painter: the concept room's WebGL renderer (added 2026-09-30; whole
// frames, manifest v3, the same day; scroll scrub, 2026-10-02; the paint
// deck removed, 2026-10-03)
// =============================================================================
// Hand-written WebGL1, no library. Loaded with a dynamic import() by the
// RoomStage script only when the section is about a screen away, so it costs
// the home page nothing up front. Budget: under 7 KB gzipped (measured from
// the build; see docs/agent/performance.md).
//
// WHAT IT DRAWS. Every step of the room's build is one COMPLETE photo (a
// "frame"). The page hands the painter a BUILD POSITION, pos in [0, n]
// (setProgress), worked out from how far the visitor has scrolled along the
// pinned track (src/lib/room-story.ts, scrubPosition). The canvas shows frame
// A = floor(pos) and, while the fraction t = pos - A is above zero, frame
// B = A + 1 coming in over it:
//
//   out    = mix(A, B', reveal)
//   reveal = change(uv') * r(e),  e = smoothstep(t)
//
// `change` is B's greyscale "where I differ from the frame before" mask, so
// outside it A shows untouched and nothing can pop. r(e) is a soft, noisy
// front shaped by the piece's motion (sweep/unroll wipe along the box's long
// axis, drop falls from the top of the box, rise comes up from the bottom,
// slide comes in from its side, pop grows from the box centre), and B' is B
// sampled at uv' = uv + offset * (1 - e): the settle into place (slide ~2.5%
// of the frame across, drop/rise ~2% down/up, pop 97% to 100% round the box
// centre). Scroll on and the piece comes in; stop and it stops part-way;
// scroll back and it goes out the way it came. At t = 1 B is whole, which is
// exactly frame A + 1 with t = 0, so crossing a piece boundary never jumps.
//
// (Until 2026-10-03 the shader also repainted the walls in a chosen paint
// chip, using a wall mask per frame and the room's wall median. The masks kept
// leaving bad edges, so the deck, the masks and all of that maths went.)
//
// SMOOTHING. A mouse wheel moves the page in steps, so the position shown
// eases toward the position asked for (about 90 ms to close most of the gap)
// and stops dead once it arrives. Reduced motion: no in-between states at all;
// the position snaps to whole frames (room-story.ts, snapPosition) and lands
// at once.
//
// RENDERING ON DEMAND. Nothing runs while idle: a draw is requested (one
// requestAnimationFrame, coalesced) when the position changes, a frame
// decodes or the canvas resizes, and the loop ends as soon as the picture has
// caught up.
//
// NEVER AN EMPTY BOX. A frame is drawn only once its photo and change mask
// have decoded. Until then the painter holds on the nearest frame below that
// has (or above, if none below has), with no piece in flight.
//
// Textures: the page's own frame <img>s (whatever currentSrc their <picture>
// chose), so the painter downloads no photo the page does not; the change
// masks are fetched as Image()s, same origin (CSP img-src 'self'), no workers,
// no blobs. FOUR texture sets (photo, change) are made once and reused for the
// life of the painter, holding the four frames used most recently, so
// scrolling to and fro across a piece boundary uploads nothing; crossing into
// a new piece uploads that one frame. setRoom() swaps rooms in the SAME
// context, so switching rooms never creates a GL context
// (tests/room-story.spec.ts counts them).
//
// Failure: createRoomPainter() returns null when there is no WebGL or a shader
// fails to compile; `onLost` fires if the context is lost later. Either way
// RoomStage falls back to crossfading the <img> stack.
// =============================================================================

export interface PainterFrame {
  /** Arms and decodes this frame's <img> (memoised by the caller). */
  load(): Promise<HTMLImageElement>;
  /** URL of the frame's change mask, or null (frame 0). */
  change: string | null;
  /** The change's box as fractions [x, y, w, h], or null (frame 0). */
  box: [number, number, number, number] | null;
  /** Index into ROOM_MOTIONS, or -1 (frame 0). */
  motion: number;
}

export interface PainterRoom {
  frames: PainterFrame[];
  /** width / height of the frames. */
  aspect: number;
}

export interface RoomPainter {
  /** Show build position `pos` in [0, frames - 1]: whole frames plus the next piece's share. */
  setProgress(pos: number): void;
  /**
   * Switch to another room (the room tabs) in the SAME GL context, showing
   * build position `pos` at once. Resolves true once drawn, false if its
   * pictures failed, or null if a later setRoom() superseded it.
   */
  setRoom(room: PainterRoom, pos: number): Promise<boolean | null>;
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
// 6 pop (ROOM_MOTIONS order); below 0 = no piece in flight. The photos are
// mixed as they are (sRGB bytes): the reveal is a soft matte, not lighting.
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;
uniform sampler2D fA,fB,cB;
uniform float ar;
uniform vec4 bB;
uniform vec2 kB;
float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 q){vec2 i=floor(q),g=fract(q);g=g*g*(3.-2.*g);
return mix(mix(h(i),h(i+vec2(1,0)),g.x),mix(h(i+vec2(0,1)),h(i+1.),g.x),g.y);}
vec3 rev(vec4 b,vec2 k,sampler2D c){
  float e=k.x,m=k.y,u=1.-e,s,g=.07,a=.2;
  if(m<0.)return vec3(v,0.);
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
  vec3 o=texture2D(fA,v).rgb,r=rev(bB,kB,cB);
  if(r.z>0.)o=mix(o,texture2D(fB,r.xy).rgb,r.z);
  gl_FragColor=vec4(o,1.);}`;

/** Gentle in and out: a piece eases off the boundary at both ends of its stretch. */
const smooth = (x: number) => x * x * (3 - 2 * x);

/** The smoothing's time constant: the shown position closes 63% of the gap in this long. */
const LAG_MS = 90;
/** Texture sets kept: the frames used most recently. */
const SETS = 4;

/** One frame's textures: photo, change mask. */
type Tex = [WebGLTexture, WebGLTexture];
interface Assets {
  img: HTMLImageElement;
  change: HTMLImageElement | null;
}
/** A texture set and the frame it holds (-1 = none), with when it was last used. */
interface Slot {
  tex: Tex;
  n: number;
  used: number;
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
  // Sampler units, in texture-bind order: A (frame), B (frame, change).
  ['fA', 'fB', 'cB'].forEach((s, i) => g.uniform1i(u(s), i));
  const U = { ar: u('ar'), b: u('bB'), k: u('kB') };

  g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // Keep the photo's own bytes, so the canvas matches the <img> exactly.
  g.pixelStorei(g.UNPACK_COLORSPACE_CONVERSION_WEBGL, g.NONE);

  // Non-power-of-two in WebGL1: clamp, linear, no mipmaps. Each starts as one
  // black pixel so no sampler ever reads an empty texture.
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
  const sets: Slot[] = Array.from({ length: SETS }, () => ({
    tex: [texture(), texture()],
    n: -1,
    used: 0,
  }));
  const put = (t: WebGLTexture, format: number, src: TexImageSource) => {
    g.bindTexture(g.TEXTURE_2D, t);
    g.texImage2D(g.TEXTURE_2D, 0, format, format, g.UNSIGNED_BYTE, src);
  };

  // ---- state ---------------------------------------------------------------
  let room = first;
  let dead = false;
  let ready = false;
  let raf = 0;
  let generation = 0;
  let clock = 0;
  let cache: Promise<Assets>[] = [];
  let got: (Assets | undefined)[] = [];
  /** The position asked for, and the position shown (they meet when idle). */
  let goal = start;
  let shown = start;
  let last = 0;

  const top = () => room.frames.length - 1;
  const fit = (pos: number) => {
    const p = Math.min(top(), Math.max(0, Number.isFinite(pos) ? pos : 0));
    return opts.reducedMotion ? Math.round(p) : p;
  };

  /** A frame's photo and change mask, decoded; memoised per room. */
  const need = (n: number): Promise<Assets> => {
    if (!cache[n]) {
      const f = room.frames[n];
      const mine = generation;
      cache[n] = Promise.all([f.load(), f.change ? mask(f.change) : null]).then(([img, change]) => {
        const a = { img, change };
        if (mine === generation) {
          got[n] = a;
          kick();
        }
        return a;
      });
      cache[n].catch(() => {});
    }
    return cache[n];
  };

  /** The set holding frame n, uploading it into the least recently used set if needed. */
  const texOf = (n: number): Tex => {
    let s = sets.find((x) => x.n === n);
    if (!s) {
      s = sets.reduce((a, b) => (b.used < a.used ? b : a));
      const a = got[n] as Assets;
      put(s.tex[0], g.RGB, a.img);
      if (a.change) put(s.tex[1], g.LUMINANCE, a.change);
      s.n = n;
    }
    s.used = ++clock;
    return s.tex;
  };

  /** The nearest decoded frame to n: n itself, else below it, else above it. */
  const nearest = (n: number) => {
    for (let i = n; i >= 0; i--) if (got[i]) return i;
    for (let i = n + 1; i <= top(); i++) if (got[i]) return i;
    return -1;
  };

  const draw = () => {
    if (dead) return;
    const want = Math.floor(shown);
    const a = nearest(want);
    if (a < 0) return; // nothing decoded yet: the <img> stack still shows
    const t = a === want ? shown - want : 0;
    const b = t > 0 && got[a + 1] ? a + 1 : -1;
    g.viewport(0, 0, canvas.width, canvas.height);
    const texA = texOf(a);
    // No piece in flight: B re-binds A's textures and is switched off.
    const texB = b < 0 ? texA : texOf(b);
    g.uniform4fv(U.b, (b < 0 ? null : room.frames[b].box) ?? [0, 0, 1, 1]);
    g.uniform2f(U.k, b < 0 ? 0 : smooth(t), b < 0 ? -1 : room.frames[b].motion);
    [texA[0], ...texB].forEach((tx, i) => {
      g.activeTexture(g.TEXTURE0 + i);
      g.bindTexture(g.TEXTURE_2D, tx);
    });
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    if (!ready) {
      ready = true;
      opts.onReady?.();
    }
  };

  function kick() {
    if (!raf && !dead) raf = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    raf = 0;
    if (dead) return;
    // Ease the shown position toward the goal (frame-rate independent), then stop.
    const dt = last ? Math.min(100, now - last) : 16;
    last = now;
    const gap = goal - shown;
    shown = Math.abs(gap) < 0.002 ? goal : shown + gap * (1 - Math.exp(-dt / LAG_MS));
    draw();
    if (shown !== goal) kick();
    else last = 0;
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
  const setRoom = (r: PainterRoom, pos: number): Promise<boolean | null> => {
    const mine = ++generation;
    room = r;
    cache = [];
    got = [];
    sets.forEach((s) => (s.n = -1));
    goal = shown = fit(pos);
    g.uniform1f(U.ar, r.aspect);
    const at = Math.floor(shown);
    return Promise.all([need(at), at < top() ? need(at + 1).catch(() => null) : null])
      .then(() => {
        if (dead) return false;
        if (mine !== generation) return null;
        resize();
        draw();
        // Decode the rest in build order, so a piece is ready when its turn comes.
        void r.frames.reduce<Promise<unknown>>(
          (p, _, i) => p.then(() => (mine === generation ? need(i).catch(() => {}) : null)),
          Promise.resolve(),
        );
        return true;
      })
      .catch(() => (dead || mine === generation ? false : null));
    /* On failure the <img> stack stays in charge. */
  };

  const api: RoomPainter = {
    setProgress(pos) {
      if (dead) return;
      goal = fit(pos);
      // Reduced motion lands at once; otherwise the shown position eases there.
      if (opts.reducedMotion) shown = goal;
      if (shown !== goal || opts.reducedMotion) kick();
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
