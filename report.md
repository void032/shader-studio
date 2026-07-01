# Universal Shader Studio Codebase Report

Generated: 2026-07-01

## Project Summary

Universal Shader Studio is a Vite React application for editing GLSL shaders in the browser and previewing them live with Three.js. The app lets the user choose a render target from procedural terrain, built-in primitives, or an uploaded GLB model. The user can edit vertex and fragment shader code, compile it into a `THREE.ShaderMaterial`, adjust shared uniforms from the UI, and export either model geometry or shader code.

The project is a static frontend. There is no backend server code in this repository.

## Main Runtime Flow

1. `index.html` loads `src/main.jsx`.
2. `src/main.jsx` mounts `App`.
3. `src/App.jsx` wraps the app in `StudioProvider`, creates the Three.js scene through hooks, renders the sidebar and canvas, and wires all user actions.
4. `src/context/StudioContext.jsx` stores global studio state: active target, terrain config, primitive config, uploaded GLB data, shader sources, shader uniforms, active tab, toast state, and export format.
5. Scene-generation hooks create or load renderable targets:
   - `useTerrain` builds procedural terrain meshes.
   - `useGLBLoader` loads and normalizes uploaded GLB scenes.
   - primitive geometry is created directly inside `App.jsx`.
6. `useShaderCompiler` tests, builds, applies, and resets shader materials.
7. `Sidebar` displays four tabs: Scene, Shader, Export, and Code.
8. Export helpers generate downloadable geometry files or reusable shader code.

## Key Concepts

- Active target: One of `terrain`, `primitive`, or `glb`. Stored in `StudioContext` with mesh reference, name, vertex count, and triangle count.
- Live uniforms: `uniformsRef` is a mutable ref containing `u_time`, `u_timeScale`, `u_warp`, `u_brightness`, `u_steps`, `u_threshold`, `u_freq`, `u_color1`, `u_color2`, `u_color3`, and `u_heightScale`.
- Shader presets: `shaderPresets.js` defines 33 built-in presets grouped as surface/material, stylized/fx, and animated.
- Manual compile model: Editing GLSL does not automatically update the preview. The user must click "Compile & Apply".
- Geometry export: Current active geometry can be exported as GLB, OBJ, or STL.
- Code export: Current shader can be exported as Three.js, React Three Fiber, raw GLSL, or vanilla WebGL scaffold code.

## Directory Overview

```text
.
+-- public/                 Static deploy assets
+-- src/
|   +-- assets/             Image assets
|   +-- components/         Sidebar, tabs, scene controls, custom UI components
|   +-- context/            Global React context for studio state
|   +-- hooks/              Three.js, shader, terrain, GLB, export hooks
|   +-- lib/                Presets, procedural noise, exporters, code templates
|   +-- styles/             Main custom app CSS
|   +-- App.jsx             Main application coordinator
|   +-- main.jsx            React entry point
+-- config files            Vite, TypeScript, Tailwind, ESLint, Vercel, package metadata
```

## File-by-File Responsibilities

### Root Files

| File | What it does |
| --- | --- |
| `package.json` | Defines the project package, scripts, runtime dependencies, and dev dependencies. Scripts are `dev`, `build`, `lint`, and `preview`. Main libraries include React, Three.js, Vite, Tailwind, Radix-related packages, Vercel analytics, and export/UI helpers. |
| `package-lock.json` | NPM lockfile pinning the full dependency tree for reproducible installs. Generated file, not application logic. |
| `index.html` | Browser entry HTML. Contains SEO, Open Graph, Twitter, canonical, Google verification, noscript crawler content, schema.org JSON-LD, root div, and module script for `/src/main.jsx`. |
| `vite.config.ts` | Vite config. Uses React plugin, sets `base: './'`, defines `@` alias to `src`, suppresses selected Rollup warnings, and manually chunks `three` plus React packages. |
| `tailwind.config.js` | Tailwind theme configuration. Enables class-based dark mode, scans app files, maps CSS variables to Tailwind color tokens, defines radii, shadows, keyframes, and uses `tailwindcss-animate`. |
| `postcss.config.js` | PostCSS config enabling Tailwind CSS and Autoprefixer. |
| `eslint.config.js` | Flat ESLint config. Ignores `dist`, applies recommended JS/TypeScript, React Hooks, and React Refresh rules to TypeScript/TSX files. |
| `tsconfig.json` | Top-level TypeScript project references for app and node configs. Also defines `@/*` path alias. |
| `tsconfig.app.json` | Browser/app TypeScript options. Strict mode, no emit, React JSX, Vite client types, bundler resolution, and `src` include. |
| `tsconfig.node.json` | Node-side TypeScript options for `vite.config.ts`. Strict mode, no emit, Node types. |
| `components.json` | shadcn/ui configuration. Defines aliases and Tailwind settings for potential generated UI components. Current actual UI directory contains only custom JSX components. |
| `vercel.json` | Vercel deployment headers. Adds security headers and a Content Security Policy allowing self-hosted scripts/styles, inline/eval script use, blob workers, and blob/data images. |
| `README.md` | Project documentation for users: overview, features, usage, tech stack, local development, structure, uniforms, export formats, deployment, and license. Some displayed characters appear mojibaked in the current file. |
| `CONTRIBUTING.md` | Contributor guide or project contribution notes. |
| `preview.png` | Preview image used by README and social/SEO metadata. |
| `report.md` | This generated codebase report. |

### Public Assets

| File | What it does |
| --- | --- |
| `public/sitemap.xml` | Sitemap for the deployed app URL with last modified date `2026-06-28`, monthly change frequency, and priority `1.0`. |

### Application Entry

| File | What it does |
| --- | --- |
| `src/main.jsx` | React entry point. Imports React, ReactDOM, and `App`, then mounts `App` into `#root` inside `React.StrictMode`. |
| `src/App.jsx` | Main application coordinator. Creates primitive geometries, adds fallback vertex colors, initializes terrain, switches active targets, handles GLB load/clear, handles primitive/terrain activation, compiles and applies shaders, resets shaders, updates animated `u_time`, displays stats, renders `Sidebar`, `WelcomeModal`, `Toast`, and Vercel Analytics/Speed Insights. |
| `src/App.css` | Default Vite starter CSS for root layout, logos, card, and docs link. It is not imported by `App.jsx` in the current code path, so it appears unused. |
| `src/index.css` | Tailwind base/components/utilities plus shadcn-style CSS variable definitions for light/dark themes. It is not imported by `main.jsx` in the current code path, so the active app styling mainly comes from `src/styles/globals.css`. |
| `src/styles/globals.css` | Main app stylesheet. Defines custom theme variables, resets, fonts, canvas layout, sidebar, tabs, controls, buttons, shader editors, code blocks, syntax highlighting, dropzone, file info, swatches, toggle, toast, stats display, export cards, primitive grid, category dividers, and spinner animation. |

### Context

| File | What it does |
| --- | --- |
| `src/context/StudioContext.jsx` | Defines `TARGET_TYPES`, `PRIMITIVE_SHAPES`, re-exports `getPresetById`, creates `StudioContext`, and provides all shared app state. Stores scene target state, terrain settings, primitive settings, GLB metadata, shader source/error/compile state, mutable uniform refs, mirrored UI uniform state, tab/toast/stats/export state, `showToast`, `updateUniform`, `updateUiUniform`, and `loadPreset`. Exports `StudioProvider` and `useStudio`. |

### Hooks

| File | What it does |
| --- | --- |
| `src/hooks/useThreeScene.js` | Sets up the Three.js renderer, scene, camera, lights, fog, grid helper, resize handling, mouse/touch orbit controls, wheel zoom, keyboard camera reset on `F`, auto-rotation, render loop, cleanup, grid visibility controls, and clock delta/elapsed helpers. |
| `src/hooks/useTerrain.js` | Creates seeded procedural terrain. Builds a plane geometry, rotates it flat, applies Perlin/FBM or island height shaping, computes normals, applies height-based vertex colors, creates/disposes terrain mesh, toggles wireframe, and exposes terrain mesh accessors. |
| `src/hooks/useShaderCompiler.js` | Builds `THREE.ShaderMaterial` objects from GLSL source and live uniforms, detects transparency, test-compiles shaders with a temporary scene, applies materials to terrain/primitive/GLB targets, clones GLB materials while sharing uniform references, resets targets to standard materials, and disposes shader material state. |
| `src/hooks/useGLBLoader.js` | Loads uploaded GLB files with `GLTFLoader`. Handles regular and instanced meshes, flattens instanced geometry, strips skinning/morph data, ensures vertex colors exist, counts vertices/triangles, recenters and scales the model, applies cloned materials, can merge geometry, and disposes loaded scene resources. |
| `src/hooks/useCodeExport.js` | Bridges UI actions to code-template functions. Builds uniform value snapshots, generates code in requested format, downloads generated files, copies generated code to clipboard, and provides format labels/descriptions. |
| `src/hooks/usePerlin.js` | React wrapper around `createPerlin`. Stores a seeded Perlin object in a ref and exposes reseed, 2D/3D noise, and 2D/3D FBM helpers. |
| `src/hooks/use-mobile.ts` | Small responsive hook. Tracks whether `window.innerWidth` is below 768px using `matchMedia`. |

### Libraries

| File | What it does |
| --- | --- |
| `src/lib/perlin.js` | Implements seeded classic Perlin noise with fade/lerp/gradient helpers, 2D and 3D noise functions, and fractal Brownian motion (`fbm2`, `fbm3`). Used by terrain generation. |
| `src/lib/colorPresets.js` | Defines terrain color gradients: grass, rock, desert, ice, neon, and mars. Exposes interpolation helpers and `generateTerrainColors`, which maps vertex height to RGB vertex colors. |
| `src/lib/shaderPresets.js` | Defines the built-in shader preset catalog and lookup helpers. Presets include height gradient, normals, toon, manual PBR, velvet, tron grid, marble, thermal, hologram, xray, iridescent, halftone, glitch, force field, wave distortion, pulse glow, dissolve, lava, breathing, plasma, matrix rain, matcap, rim light, wireframe overlay, depth fog, outline, glitch/datamosh, stipple, neon glow, voronoi flow, lightning, caustics, and magnetic field. Exports `PRESETS`, `getPresetById`, and `getPresetsByCategory`. |
| `src/lib/codeTemplates.js` | Generates reusable shader code in several formats. Includes uniform filtering, alpha detection, Three.js `ShaderMaterial` output, React Three Fiber component output, raw GLSL plus `uniforms.json`, vanilla WebGL HTML scaffold, and a browser download helper. |
| `src/lib/exporters.js` | Exports geometry to GLB, OBJ/MTL, and binary STL. Handles binary padding, accessors/buffer views for GLB, OBJ vertices/normals/faces/colors, STL triangle normals, and browser downloads. |
| `src/lib/utils.ts` | Utility `cn` helper combining `clsx` and `tailwind-merge` for class name composition. Currently useful for shadcn-style components, though the active custom JSX UI mostly uses explicit classes/inline styles. |

### Components

| File | What it does |
| --- | --- |
| `src/components/Sidebar.jsx` | Fixed left sidebar. Displays logo/header, tab buttons, and renders one of `SceneTab`, `ShaderTab`, `ExportTab`, or `CodeTab` based on context `activeTab`. Passes app handlers down into tabs. |

### Scene Components

| File | What it does |
| --- | --- |
| `src/components/scene/TerrainControls.jsx` | Scene tab section for terrain. Lets the user choose Perlin or island source, adjust resolution, height scale, noise frequency, octaves, color preset, wireframe, regenerate terrain, and set terrain active. |
| `src/components/scene/GLBControls.jsx` | Scene tab section for GLB uploads. Shows `FileDropZone` when no GLB is loaded, otherwise shows file name, vertex/triangle counts, and a clear button. |
| `src/components/scene/PrimitiveControls.jsx` | Scene tab section for built-in primitives. Lets the user select box, sphere, torus, torus knot, cylinder, or cone and adjust shape-specific dimensions/segment counts before setting it active. |

### Tab Components

| File | What it does |
| --- | --- |
| `src/components/tabs/SceneTab.jsx` | Composes `TerrainControls`, `GLBControls`, and `PrimitiveControls` into the Scene tab. Reads active target from context but does not currently use it for conditional rendering. |
| `src/components/tabs/ShaderTab.jsx` | Shader editing UI. Groups presets by category, shows preset descriptions, renders vertex and fragment textareas with line numbers and tab insertion, displays shader compile errors, provides compile/reset buttons, and exposes uniform controls for time scale, warp, brightness, optional steps/threshold/frequency, and three colors. |
| `src/components/tabs/ExportTab.jsx` | Export UI for the active target. Finds geometry from the active mesh, triggers GLB/OBJ/STL exporters, displays target metadata, and links to the Code tab for shader code export. For GLB targets it currently exports the first mesh geometry it finds rather than the merged helper from `useGLBLoader`. |
| `src/components/tabs/CodeTab.jsx` | Shader code export UI. Lets the user switch between Three.js, R3F, GLSL, and vanilla WebGL formats, renders generated code in `CodeBlock`, copies to clipboard, downloads generated files, and displays current uniform values. |

### Custom UI Components

| File | What it does |
| --- | --- |
| `src/components/ui/WelcomeModal.jsx` | First-run onboarding modal stored with `localStorage` key `shader-studio-welcomed`. Shows four guide steps for terrain, primitives, GLB upload, and manual shader compilation. |
| `src/components/ui/Toast.jsx` | Minimal toast component. Renders a fixed success/error notification when a message exists. |
| `src/components/ui/CodeBlock.jsx` | Code display component with a simple regex-based GLSL/JavaScript syntax highlighter, line numbers, copy button, download button, and highlighted HTML output. |
| `src/components/ui/FileDropZone.jsx` | Drag/drop and click-to-browse file selector. Accepts `.glb` by default, validates extension, enforces a 25 MB size limit, and calls `onFileSelect`. Comments mention 100 MB but code uses 25 MB. |
| `src/components/ui/Slider.jsx` | Reusable labeled range input with value display, formatting hook, min/max/step, and disabled support. |
| `src/components/ui/Toggle.jsx` | Reusable labeled boolean toggle using custom CSS classes. |
| `src/components/ui/ColorSwatch.jsx` | Labeled color input with uppercase hex display. |

### Assets

| File | What it does |
| --- | --- |
| `src/assets/logo.png` | Logo image imported by `Sidebar.jsx` and shown in the sidebar header. |

## State and Data Flow Details

### Scene Targets

- Terrain starts as the default target when the scene initializes.
- Primitive targets are created from `primitiveConfig` in `App.jsx`.
- GLB targets are loaded by `useGLBLoader` and become active immediately after upload.
- `activeTarget` carries both the render object and UI-facing metadata.

### Shader Lifecycle

1. User selects a preset or edits GLSL in `ShaderTab`.
2. `StudioContext` stores `vertSrc` and `fragSrc`.
3. User clicks "Compile & Apply".
4. `App.jsx` calls `testCompile` from `useShaderCompiler`.
5. On success, `buildShaderMaterial` creates a live `THREE.ShaderMaterial`.
6. `applyToTarget` replaces the active target's material.
7. An animation loop increments `uniformsRef.current.u_time.value` every frame.

### Export Lifecycle

- Model export: `ExportTab` passes active target geometry to `exportGLB`, `exportOBJ`, or `exportSTL`.
- Shader code export: `CodeTab` uses `useCodeExport`, which uses `codeTemplates.js` to generate text output and download/copy it.

## Notable Observations

- The actual current `src/components/ui` directory only contains seven custom JSX UI files. The `components.json` file is configured for shadcn/ui, but generated shadcn TSX components are not present in the current tree.
- `README.md` and some UI strings display mojibaked characters for emojis and punctuation in the current file contents.
- `App.css` looks like leftover Vite starter CSS and is not imported by the current app entry path.
- `src/index.css` defines Tailwind/shadcn variables, but `main.jsx` does not import it. The active app imports `src/styles/globals.css` from `App.jsx`.
- `package.json` currently lists React `^19.2.0` and Three `^0.128.0`, while the README text/badges describe React 18 and Three r168.
- `eslint.config.js` only targets `**/*.{ts,tsx}` files, so most current application logic in `.jsx` and `.js` is not linted by that config.
- `FileDropZone.jsx` comments say "100MB limit", but the actual limit is `25 * 1024 * 1024`.
