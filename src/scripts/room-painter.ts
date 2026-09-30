// Foundation, edit with care
// =============================================================================
// room-painter: the concept room's WebGL wall painter (added 2026-09-30)
// =============================================================================
// Hand-written WebGL1, no library. Loaded with a dynamic import() by the
// RoomStage script only when the section is about a screen away, so it costs
// the home page nothing up front. Budget: under 12 KB gzipped (measured from
// the build; see docs/agent/performance.md).
//
// It paints ONE thing: the WALLS of the empty base room, into a canvas that
// sits right above the base <img> and below every furniture layer. The pieces
// and their multiply shade layers are plain <img>s stacked on top (CSS moves
// them), so their shadows stay correct under any paint colour.
//
// The paint keeps the photo's own light and shadow. All maths in linear light:
//   shade   = luma(px) / luma(median)
//   tint    = mix(1, (px / luma(px)) / (median / luma(median)), 0.35)
//   painted = chip * shade * tint
//   out     = mix(px, painted, mask * paintAmount)
// `median` is the base wall's median colour from the manifest (worked out at
// publish time), which is what lets a tan wall repaint to a true Oat instead
// of a muddy Oat-tan. "As it is" is paintAmount 0.
//
// A chip change rolls the new colour on from the left with a noisy front
// (~900ms, cubic-bezier(0.23, 1, 0.32, 1)); reduced motion makes it instant.
// The rAF loop runs only during a roll and stops dead once it lands.
//
// Texture: the page's own base <img> (whatever currentSrc it chose), so the
// painter downloads no picture the page has not already loaded; the mask is
// fetched once per room.
//
// Several rooms (the room tabs, 2026-09-30): setBase() swaps the base, mask
// and median for another room's, re-using the same context, program and the
// same two texture objects, so switching rooms never creates a GL context
// (tests/room-story.spec.ts counts them). The chip in force carries over.
//
// Failure: createRoomPainter() returns null when there is no WebGL or a shader
// fails to compile; `onLost` fires if the context is lost later. Either way
// RoomStage keeps the plain <img> and the chip deck stays hidden.
// =============================================================================

export interface PainterBase {
  /** The page's base <img> (its currentSrc is what we draw). */
  img: HTMLImageElement;
  /** URL of the greyscale wall mask (white = wall). */
  maskUrl: string;
  /** Wall median colour, linear light. */
  median: [number, number, number];
}

export interface RoomPainter {
  /** Paint the walls this colour (linear rgb), or null for "As it is". */
  setChip(linear: [number, number, number] | null): void;
  /**
   * Switch to another room (the room tabs): reload the base and mask
   * textures and the wall median in the SAME GL context, keeping the chip.
   * Resolves true once the new room is drawn, false if its pictures failed,
   * or null if a later setBase() superseded it.
   */
  setBase(base: PainterBase): Promise<boolean | null>;
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

const VERT = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;

// Fragment shader. Names are short on purpose (it ships as a string).
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;
uniform sampler2D f,m;
uniform vec3 d,cO,cN;
uniform float pO,pN,tC;
float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 q){vec2 i=floor(q),g=fract(q);g=g*g*(3.-2.*g);
return mix(mix(h(i),h(i+vec2(1,0)),g.x),mix(h(i+vec2(0,1)),h(i+1.),g.x),g.y);}
vec3 lin(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));}
vec3 srgb(vec3 c){c=clamp(c,0.,1.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
float lu(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 paint(vec3 px,vec3 ch){
  float l=max(lu(px),1e-4),lm=max(lu(d),1e-4);
  vec3 t=mix(vec3(1.),(px/l)/(d/lm),.35);
  return ch*(l/lm)*t;}
void main(){
  vec3 px=lin(texture2D(f,v).rgb);
  float w=texture2D(m,v).r;
  float fr=tC*1.3-.15;
  float roll=1.-smoothstep(fr-.025,fr+.025,v.x+(n(vec2(v.y*9.,tC*3.))-.5)*.16);
  vec3 a=mix(px,paint(px,cO),w*pO);
  vec3 b=mix(px,paint(px,cN),w*pN);
  gl_FragColor=vec4(srgb(mix(a,b,roll)),1.);}`;

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

const CHIP_MS = 900;

export function createRoomPainter(
  canvas: HTMLCanvasElement,
  base: PainterBase,
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
  const U = { d: u('d'), cO: u('cO'), cN: u('cN'), pO: u('pO'), pN: u('pN'), tC: u('tC') };
  g.uniform1i(u('f'), 0);
  g.uniform1i(u('m'), 1);
  g.uniform3fv(U.d, base.median);

  g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
  g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // Keep the photo's own bytes: the colour maths is done in the shader.
  g.pixelStorei(g.UNPACK_COLORSPACE_CONVERSION_WEBGL, g.NONE);

  // Two texture objects for the life of the painter (unit 0 base, unit 1
  // mask); a room switch re-uploads into them.
  const makeTexture = (unit: number) => {
    const t = g.createTexture();
    g.activeTexture(g.TEXTURE0 + unit);
    g.bindTexture(g.TEXTURE_2D, t);
    // Non-power-of-two in WebGL1: clamp, linear, no mipmaps.
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    return t;
  };
  const textures = [makeTexture(0), makeTexture(1)];
  const upload = (unit: number, src: TexImageSource) => {
    g.activeTexture(g.TEXTURE0 + unit);
    g.bindTexture(g.TEXTURE_2D, textures[unit]);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src);
  };

  // ---- state ---------------------------------------------------------------
  let dead = false;
  let loaded = false;
  let ready = false;
  let raf = 0;
  let chipOld: [number, number, number] = [1, 1, 1];
  let chipNew: [number, number, number] = [1, 1, 1];
  let paintOld = 0;
  let paintNew = 0;
  let chipT = 0;
  let chipStart = 0;
  let busy = false;

  const draw = () => {
    if (dead || !loaded) return;
    g.viewport(0, 0, canvas.width, canvas.height);
    g.uniform3fv(U.cO, chipOld);
    g.uniform3fv(U.cN, chipNew);
    g.uniform1f(U.pO, paintOld);
    g.uniform1f(U.pN, paintNew);
    g.uniform1f(U.tC, busy ? ease(chipT) : 0);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    if (!ready) {
      ready = true;
      opts.onReady?.();
    }
  };
  const land = () => {
    busy = false;
    chipT = 0;
    chipOld = chipNew;
    paintOld = paintNew;
    draw();
  };
  const tick = (now: number) => {
    raf = 0;
    if (dead || !busy) return;
    chipT = Math.min(1, (now - chipStart) / CHIP_MS);
    draw();
    if (chipT >= 1) land();
    else raf = requestAnimationFrame(tick);
  };

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

  // ---- load a room's base and mask, then draw -----------------------------
  let generation = 0;
  const load = (b: PainterBase): Promise<boolean | null> => {
    const mine = ++generation;
    const mask = new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = b.maskUrl;
    });
    // A lazy <img> may not have started yet; ask for it now.
    if (!b.img.complete || !b.img.naturalWidth) b.img.loading = 'eager';
    return Promise.all([b.img.decode().then(() => b.img), mask])
      .then(([img, m]) => {
        if (dead) return false;
        if (mine !== generation) return null;
        upload(0, img);
        upload(1, m);
        g.uniform3fv(U.d, b.median);
        loaded = true;
        resize();
        draw();
        return true;
      })
      .catch(() => (dead || mine === generation ? false : null));
    /* On failure the plain <img> stays in charge and the chips stay hidden. */
  };
  void load(base);

  return {
    setChip(linear) {
      if (dead) return;
      // Finish a roll in progress first, so the new one starts from what shows.
      if (busy) land();
      chipNew = linear ?? chipOld;
      paintNew = linear ? 1 : 0;
      if (opts.reducedMotion || !loaded) {
        land();
        return;
      }
      busy = true;
      chipT = 0;
      chipStart = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    },
    setBase(b) {
      if (dead) return Promise.resolve(false);
      // Land a roll in progress, so the new room shows the chip in force.
      if (busy) land();
      return load(b);
    },
    destroy() {
      if (dead) return;
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      g.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
