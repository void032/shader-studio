# Contributing to Universal Shader Studio

> A browser-based GLSL editor — real-time, zero setup, open source.  
> Built by [Void](https://github.com/void032) · [Live Demo](https://shader-studio-teal.vercel.app) · MIT License

Thanks for taking the time to contribute. This doc covers everything you need — from reporting a bug to shipping a feature.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Conventions](#code-conventions)
- [Project Structure](#project-structure)
- [Good First Contributions](#good-first-contributions)

---

## Getting Started

**Requirements:** Node.js 20+

```bash
# 1. Fork the repo, then clone your fork
git clone https://github.com/YOUR_USERNAME/shader-studio.git
cd shader-studio

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

**Build for production:**
```bash
npm run build
```

That's it — pure static frontend, no backend, no env variables needed.

---

## Reporting Bugs

Before opening an issue, check if it's already reported in [Issues](https://github.com/void032/shader-studio/issues).

**When filing a bug, include:**

- What you expected to happen
- What actually happened
- Steps to reproduce it
- Your browser + OS
- Any console errors (F12 → Console)
- If it's shader-related, paste the GLSL that triggered it

Use this template:

```
**Describe the bug**
A clear description of what the bug is.

**Steps to reproduce**
1. Go to '...'
2. Click '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment**
- Browser: [e.g. Chrome 124]
- OS: [e.g. Windows 11]
- Console errors: [paste here]
```

---

## Suggesting Features

Open a [Feature Request issue](https://github.com/void032/shader-studio/issues/new) and describe:

- **What** you want added
- **Why** — what problem does it solve or what does it unlock
- **How** you imagine it working (rough idea is fine)

Feature requests that align with the core use case get priority:

> *Fast, browser-based GLSL experimentation with zero friction.*

Things that add setup complexity, external dependencies, or require a backend are unlikely to be merged — that's a deliberate design constraint.

---

## Submitting a Pull Request

1. **Fork** the repo and create a branch from `main`

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/what-youre-fixing
```

2. **Make your changes** — keep commits focused and descriptive

```bash
git commit -m "feat: add auto-compile toggle to shader editor"
git commit -m "fix: correct terrain height scaling on resolution change"
```

3. **Test before pushing** — make sure the build passes

```bash
npm run build
```

4. **Open a PR** against `main` with:
   - A clear title
   - What changed and why
   - Screenshots or a short clip if it's a visual change

**PR checklist:**
- [ ] Tested in Chrome (primary target) and Firefox
- [ ] No console errors introduced
- [ ] `npm run build` passes without warnings
- [ ] Existing features still work (terrain, primitives, GLB upload, shader compile, export)

---

## Code Conventions

No strict linter config — just follow the patterns already in the codebase.

**General:**
- Functional components + hooks — no class components
- Keep hooks single-responsibility (`useThreeScene` does scene setup, not shader compilation)
- State lives in `StudioContext` unless it's purely local UI state
- Name things clearly — no abbreviations that need decoding

**GLSL / Three.js:**
- New uniforms injected into shaders go through the existing uniform pipeline in `useShaderCompiler`
- Shader presets live in `src/lib/shaderPresets` — add new ones there, not inline
- Three.js object cleanup (`.dispose()`) is required — memory leaks in WebGL are real

**Styling:**
- Tailwind utility classes only — no custom CSS unless absolutely necessary
- shadcn/ui for UI primitives — don't reinvent buttons, dialogs, sliders
- Dark theme is the only theme — don't add light mode surface colors

---

## Project Structure

```
src/
├── components/
│   ├── scene/          # TerrainControls, PrimitiveControls, GLBControls
│   ├── tabs/           # SceneTab, ShaderTab, ExportTab, CodeTab
│   └── ui/             # shadcn components + FileDropZone, CodeBlock, etc.
├── context/
│   └── StudioContext   # Global app state — mesh, shader, export format
├── hooks/
│   ├── useThreeScene   # Three.js scene/camera/renderer lifecycle
│   ├── useGLBLoader    # GLB ingestion, auto-center, auto-scale
│   ├── useShaderCompiler  # GLSL compilation + error handling
│   ├── useTerrain      # Procedural terrain generation
│   └── usePerlin       # Perlin noise implementation
└── lib/
    ├── shaderPresets   # Built-in GLSL starting points
    ├── codeTemplates   # Export format generators (Three.js, R3F, WebGL)
    ├── colorPresets    # Terrain color themes
    └── exporters       # Multi-format export logic
```

When adding a new feature, put it where it fits this structure. If it genuinely doesn't fit, that's worth noting in the PR.

---

## Good First Contributions

These are known gaps that are well-scoped and don't require deep architectural knowledge:

| Area | What's Needed |
|---|---|
| **Shader Editor** | Auto-compile toggle — recompile on keystroke after a debounce delay |
| **Shader Editor** | Line numbers in the editor |
| **Export** | Download as `.glsl` file (raw, not just copy to clipboard) |
| **Terrain** | More color presets — the current set is small |
| **Primitives** | Plane / flat grid primitive option |
| **UX** | Error message when a GLB fails to load (currently silent) |
| **Docs** | Screenshots of each feature for the README |

If you pick one up, comment on the issue so others know it's in progress.

---

## License

By contributing, you agree that your contributions will be licensed under the same [MIT License](./LICENSE) that covers this project.

---

Built by [Void](https://github.com/void032) — contributions welcome, bloat is not.