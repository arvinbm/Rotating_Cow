# Interactive Rotating Cow

A real-time 3D WebGL application that renders an interactive cow model with Phong lighting, a global light source, and a sweeping spotlight. Built from scratch using raw WebGL2 and GLSL shaders — no libraries or 3D engines.

---

## Features

- **Phong lighting model** — ambient, diffuse, and specular components computed per-fragment in GLSL
- **Global light source** — orbits the scene when toggled; visualized as a red wireframe marker
- **Spotlight** — sweeps left and right automatically when toggled; visualized as a yellow wireframe cone
- **Full 6-DOF interaction** — translate along X/Y (left-drag), translate along Z (arrow up/down), rotate along X/Y (right-drag), rotate along Z (arrow left/right)
- **One-key reset** — press `r` to snap the cow back to the origin in its default orientation
- **Raw WebGL2** — vertex and fragment shaders written in GLSL, compiled and linked at runtime; no Three.js, no Babylon.js

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | JavaScript |
| Graphics API | WebGL2 |
| Shading | GLSL (vertex + fragment shaders) |
| Math Library | MV.js (Angel & Shreiner) |
| Cow Geometry | cow.js — 8700+ lines of vertex/face data |
| Markup | HTML5 Canvas |

---

## Controls

| Input | Action |
|---|---|
| Left-drag mouse | Translate cow along X and Y |
| Right-drag mouse | Rotate cow along X and Y |
| Up / Down arrow keys | Translate cow toward / away from camera (Z axis) |
| Left / Right arrow keys | Rotate cow counter-clockwise / clockwise (Z axis) |
| p | Toggle global light source orbiting |
| s | Toggle spotlight sweeping |
| r | Reset cow to origin |

---

## Getting Started

No build step required — open directly in a browser that supports WebGL2.

```bash
git clone https://github.com/arvinbm/Rotating_Cow.git
cd Rotating_Cow
npx serve .
```

Then open http://localhost:3000 in Chrome or Firefox.

Alternatively, open index.html directly — most browsers will load it from the filesystem without a server.

---

## Lighting Model

The fragment shader implements a three-component Phong model:

- **Ambient** — constant base colour (0.52, 0.37, 0.26) scaled by 0.6
- **Diffuse** — computed from the dot product of the surface normal and the direction to the global light source
- **Specular** — half-vector Blinn-Phong highlight with configurable shininess (default 200)
- **Spotlight** — additive yellow-tinted contribution (0.5, 0.5, 0.1) applied to fragments inside the spotlight cone (7.5 degree half-angle, cosine test)

---

## Screenshots

### Default View

The cow rendered on load with Phong shading. The yellow wireframe is the spotlight indicator; the red X is the global light source.

![Default view](screenshots/01_default.png)

---

### Right-Drag Rotation

Right-click and drag to rotate the cow freely along the X and Y axes.

![Cow rotated to show rear view](screenshots/02_rotated.png)

---

### Global Light Source Orbiting (p)

Press p to start the global light source orbiting around the scene. The diffuse and specular highlights shift visibly as the light moves.

![Global light source rotating](screenshots/03_light_rotating.png)

---

### Spotlight Active (s)

Press s to toggle the spotlight. It sweeps left and right automatically through a 60 degree arc, casting a warm yellow-tinted beam on the cow's surface.

![Spotlight sweeping across the cow](screenshots/04_spotlight.png)

---

### Left-Drag Translation

Left-click and drag to translate the cow along the X and Y axes.

![Cow translated from origin](screenshots/05_translated.png)

---

### Reset (r)

Press r at any time to snap the cow back to its starting position and orientation.

![Cow reset to origin](screenshots/06_reset.png)

---

## Bug Fixes

Two bugs were fixed from the original submission:

1. **Depth buffer not cleared each frame** — gl.clear was only clearing COLOR_BUFFER_BIT. With depth testing enabled, the depth buffer accumulated stale values across frames, causing z-fighting artifacts as the cow rotated. Fixed by adding DEPTH_BUFFER_BIT: gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT).

2. **gl.clearColor called after gl.clear** — the clear colour was set to black after the buffer was already cleared, so the first frame always rendered with the grey initialisation colour. Fixed by moving gl.clearColor before the gl.clear call.

---

## Notes

- Requires a browser with WebGL2 support (Chrome 56+, Firefox 51+, Safari 15+)
- The cow geometry (cow.js) is a standard benchmark mesh
- Shader source is stored as string arrays in app.js and compiled at runtime via gl.compileShader
