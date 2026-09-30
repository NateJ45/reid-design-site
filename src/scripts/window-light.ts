// Foundation, edit with care
// =============================================================================
// Window light: afternoon sun and leaf shadows drifting across a band (WebGL)
// (2026-09-30)
// =============================================================================
// The feeling of sitting in a living room at four in the afternoon: a patch of
// sun from a window, cut by its muntins, with the shadows of leaves outside
// swaying slowly across everything. One small fragment shader, drawn onto a
// canvas laid over the band with `mix-blend-mode: soft-light`, so it lightens
// and darkens what is under it (the photo and the Walnut ground)
// without ever painting a colour of its own.
//
// Opt in with an attribute on the band:
//   data-window-light="sun"    sun patch + leaf shadows (the home hero)
//   data-window-light="shade"  leaf shadows only, never lighter (bands where
//                              cream text sits everywhere, e.g. the closing
//                              CTA: shade can only RAISE text contrast)
//
// CONTRAST: in "sun" mode the bright patch is masked to the PHOTO side of the
// band (the right on desktop, the top on phones), never under the copy, and
// the leaf shadows only ever darken Walnut, which makes cream text stronger.
//
// Cost and courtesy:
//   - prefers-reduced-motion: reduce -> never starts (the band is unchanged)
//   - no WebGL                       -> never starts
//   - drawn at half resolution (it is all soft shapes), capped at 30 fps
//   - paused whenever the band is off screen or the tab is hidden
//   - fades in over two seconds, so its arrival is never a jump
// =============================================================================

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform float uAspect;   // width / height
uniform float uSun;      // 1 = sun patch on, 0 = shade only
uniform float uSide;     // 0 = sun on the right (desktop), 1 = sun on top (phone)
uniform float uFade;     // 0..1 entrance

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main() {
  // y down, like the page.
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 p = vec2(uv.x * uAspect, uv.y);
  float t = uTime;

  // ---- Leaves: clumps of soft shadow, swaying as the wind comes and goes.
  float gust = 0.6 + 0.4 * sin(t * 0.21) * sin(t * 0.13 + 1.7);
  vec2 q = p * 3.6;
  q += vec2(sin(t * 0.35 + q.y * 1.3), cos(t * 0.29 + q.x * 1.1)) * 0.09 * gust;
  q += vec2(t * 0.015, -t * 0.008);
  // Big clumps of foliage, broken up by smaller leaves, then thresholded
  // with a soft edge (the penumbra of real leaf shadow).
  float n = 0.72 * fbm(q) + 0.28 * noise(q * 3.3 + vec2(t * 0.08, t * 0.05));
  float leaves = smoothstep(0.55, 0.64, n);

  // ---- The window: a skewed patch of sun with two muntin shadows across it.
  vec2 w = uv;
  w.x += (w.y - 0.5) * 0.42;           // the sun comes in at an angle
  float edge = 0.045;                  // soft, like real sunlight
  float win = smoothstep(0.50, 0.50 + edge, w.x) * (1.0 - smoothstep(1.02 - edge, 1.02, w.x))
            * smoothstep(-0.05, -0.05 + edge, w.y) * (1.0 - smoothstep(0.92 - edge, 0.92, w.y));
  float mullion = min(smoothstep(0.012, 0.032, abs(w.x - 0.76)), smoothstep(0.012, 0.032, abs(w.y - 0.44)));
  // Keep the sun to the photo side of the band, never under the words.
  float side = mix(smoothstep(0.58, 0.72, uv.x), 1.0 - smoothstep(0.40, 0.54, uv.y), uSide);
  float sun = uSun * win * mullion * side * (1.0 - 0.85 * leaves);

  // ---- Soft-light value: 0.5 changes nothing, above lightens, below darkens.
  float v = 0.5 + 0.28 * sun - 0.16 * leaves * (1.0 - sun);
  v = mix(0.5, v, uFade);
  gl_FragColor = vec4(vec3(v), 1.0);
}`;

type Mode = 'sun' | 'shade';

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

function start(host: HTMLElement) {
  const mode: Mode = host.dataset.windowLight === 'shade' ? 'shade' : 'sun';
  const canvas = document.createElement('canvas');
  canvas.className = 'wl-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  });
  if (!gl) return;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const u = (name: string) => gl.getUniformLocation(prog, name);
  const uTime = u('uTime');
  const uAspect = u('uAspect');
  const uSun = u('uSun');
  const uSide = u('uSide');
  const uFade = u('uFade');
  gl.uniform1f(uSun, mode === 'sun' ? 1 : 0);

  host.appendChild(canvas);

  // Half resolution: the picture is all soft gradients, and soft-light
  // hides the upscale completely.
  const resize = () => {
    const r = host.getBoundingClientRect();
    const scale = 0.5;
    canvas.width = Math.max(2, Math.min(960, Math.round(r.width * scale)));
    canvas.height = Math.max(2, Math.round((canvas.width * r.height) / Math.max(1, r.width)));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uAspect, r.width / Math.max(1, r.height));
    gl.uniform1f(uSide, r.width >= 1024 ? 0 : 1);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  let visible = false;
  let raf = 0;
  let last = 0;
  // A random start, so two visits never show the same leaves.
  const t0 = performance.now() - Math.random() * 60_000;
  const born = performance.now();

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden || !canvas.isConnected) return;
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return; // ~30 fps is plenty for leaves
    last = now;
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.uniform1f(uFade, Math.min(1, (now - born) / 2000));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const run = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    run();
  });
  io.observe(host);
  document.addEventListener('visibilitychange', run);

  canvas.addEventListener('webglcontextlost', () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    canvas.remove();
  });
  requestAnimationFrame(() => canvas.classList.add('is-on'));
}

/**
 * Start every [data-window-light] band on the page that is not running yet.
 * Each one waits until it is near the screen (so the closing band on every
 * page costs nothing until someone scrolls to it), then until the browser is
 * idle (so it never competes with the hero's LCP).
 */
export function initWindowLight() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const near = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        near.unobserve(e.target);
        const go = () => start(e.target as HTMLElement);
        if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 });
        else setTimeout(go, 1200);
      }
    },
    { rootMargin: '300px 0px' },
  );
  document.querySelectorAll<HTMLElement>('[data-window-light]').forEach((host) => {
    if (host.dataset.windowLightOn) return;
    host.dataset.windowLightOn = '1';
    near.observe(host);
  });
}
