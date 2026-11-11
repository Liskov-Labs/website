// Animated WebGL background. If WebGL is unavailable, the shader fails to
// compile, or the context is lost, the canvas is removed/hidden and the page
// falls back to the plain CSS background colour.
(function () {
  "use strict";

  var canvas = document.getElementById("bg");
  if (!canvas) return;

  function fallback() {
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  var gl = null;
  try {
    var opts = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    };
    gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
  } catch (e) {
    gl = null;
  }
  if (!gl) return fallback();

  var VERT = [
    "attribute vec2 a_pos;",
    "void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }",
  ].join("\n");

  var FRAG = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform vec2 u_res;",
    "uniform float u_time;",
    "uniform vec2 u_mouse;",

    "float hash(vec2 p) {",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",

    "float noise(vec2 p) {",
    "  vec2 i = floor(p), f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),",
    "             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);",
    "}",

    "float fbm(vec2 p) {",
    "  float v = 0.0, a = 0.5;",
    "  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);",
    "  for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= 0.5; }",
    "  return v;",
    "}",

    "float blob(vec2 p, vec2 c, float r) {",
    "  vec2 d = p - c;",
    "  return exp(-dot(d, d) / (r * r));",
    "}",

    // Sparse field of glassy bubbles drifting upward with a slight wobble.
    "float bubbles(vec2 p, float t, float scale, float speed) {",
    "  vec2 g = p * scale;",
    "  g.y -= t * speed;",
    "  vec2 id = floor(g);",
    "  vec2 f = fract(g) - 0.5;",
    "  float h = hash(id);",
    "  if (h > 0.28) return 0.0;",
    "  vec2 off = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.45;",
    "  off.x += 0.07 * sin(t * 1.5 + h * 40.0);",
    "  float r = 0.05 + 0.1 * hash(id + 1.3);",
    "  float d = length(f - off);",
    "  float fill = smoothstep(r, r - 0.02, d);",
    "  float ring = fill - smoothstep(r - 0.02, r - 0.045, d);",
    "  float shine = blob(f, off + vec2(-0.35, 0.35) * r, r * 0.35);",
    "  return fill * 0.25 + ring * 0.6 + shine * 0.6;",
    "}",

    "void main() {",
    "  vec2 uv = gl_FragCoord.xy / u_res;",
    "  float m = min(u_res.x, u_res.y);",
    "  vec2 asp = u_res / m;",
    "  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / m;",
    "  float t = u_time;",

    // Organic domain warp so the colour fields flow like liquid.
    "  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t * 0.06)),",
    "                fbm(p * 1.3 + vec2(5.2, 1.3) - t * 0.05));",
    "  vec2 wp = p + (q - 0.5) * 0.6;",
    "  float n = fbm(p * 1.5 + 2.0 * q + t * 0.035);",

    // Colour blobs orbiting the whole viewport, centre included.
    "  float s = t * 0.22;",
    "  vec2 c1 = vec2(sin(s * 1.1), cos(s * 0.9)) * asp * vec2(0.30, 0.26);",
    "  vec2 c2 = vec2(cos(s * 0.7 + 2.0), sin(s * 1.3 + 1.0)) * asp * vec2(0.34, 0.30);",
    "  vec2 c3 = vec2(sin(s * 0.8 + 4.0), cos(s * 0.6 + 3.0)) * asp * vec2(0.28, 0.32);",
    "  vec2 c4 = vec2(cos(s * 1.2 + 5.0), sin(s * 0.75 + 2.5)) * asp * vec2(0.36, 0.30);",

    "  vec3 base = vec3(0.945, 0.985, 0.955);",
    "  vec3 mint = vec3(0.66, 0.92, 0.78);",
    "  vec3 lime = vec3(0.72, 0.93, 0.40);",
    "  vec3 leaf = vec3(0.227, 0.710, 0.286);",
    "  vec3 teal = vec3(0.24, 0.76, 0.64);",
    "  vec3 deep = vec3(0.0, 0.404, 0.220);",

    "  vec3 col = base;",
    "  col = mix(col, mint, blob(wp, c3, 0.60));",
    "  col = mix(col, lime, blob(wp, c1, 0.44) * 0.9);",
    "  col = mix(col, leaf, blob(wp, c2, 0.40) * 0.85);",
    "  col = mix(col, teal, blob(wp, c4, 0.40) * 0.8);",
    "  col = mix(col, deep, blob(wp, -c2 * 0.8, 0.26) * 0.5);",

    // Pointer-follow glow.
    "  col = mix(col, lime, blob(wp, u_mouse, 0.30) * 0.55);",
    "  col += 0.10 * blob(p, u_mouse, 0.16);",

    // Thin topographic contour lines drifting through the field.
    "  float f = fract(n * 9.0 - t * 0.06);",
    "  float line = smoothstep(0.0, 0.025, f) * (1.0 - smoothstep(0.025, 0.06, f));",
    "  col = mix(col, vec3(1.0), line * 0.3);",

    // Rising bubbles, densest near the bottom.
    "  float b = bubbles(p, t, 6.0, 0.4) + 0.7 * bubbles(p + vec2(3.7, 1.1), t, 10.0, 0.6);",
    "  col = mix(col, vec3(1.0), clamp(b, 0.0, 1.0) * 0.5 * smoothstep(1.15, 0.0, uv.y));",

    // Film grain (also hides gradient banding).
    "  col += (hash(gl_FragCoord.xy + fract(t) * 100.0) - 0.5) * 0.04;",

    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return fallback();

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fallback();
  gl.useProgram(prog);

  // One oversized triangle covers the whole viewport.
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, "u_res");
  var uTime = gl.getUniformLocation(prog, "u_time");
  var uMouse = gl.getUniformLocation(prog, "u_mouse");

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timeOffset = 20 + Math.random() * 40;
  var start = performance.now();
  var raf = 0;
  var lost = false;

  // Pointer position in shader space (centre = 0,0; shorter side spans 1).
  var mouse = { x: 0, y: 0 };
  var target = null;
  var lastPointer = -Infinity;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function onPointer(e) {
    var w = window.innerWidth, h = window.innerHeight, m = Math.min(w, h);
    target = { x: (e.clientX - w / 2) / m, y: (h / 2 - e.clientY) / m };
    lastPointer = performance.now();
  }

  function draw(now) {
    if (lost) return;
    resize();
    var t = timeOffset + (now - start) / 1000;

    // Follow the pointer; drift on a slow orbit when it's idle.
    var idle = now - lastPointer > 4000 || !target;
    var tx = idle ? Math.sin(t * 0.3) * 0.35 : target.x;
    var ty = idle ? Math.cos(t * 0.23) * 0.22 : target.y;
    mouse.x += (tx - mouse.x) * 0.04;
    mouse.y += (ty - mouse.y) * 0.04;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  function play() {
    if (reduceMotion || raf || lost) return;
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    lost = true;
    pause();
    canvas.classList.remove("ready");
  });

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onPointer, { passive: true });

  window.addEventListener("resize", function () {
    if (reduceMotion) draw(start);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
    else play();
  });

  draw(start);
  canvas.classList.add("ready");
  play();
})();
