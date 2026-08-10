# SunnyShoots — Website

## Project Overview

This repository contains the front-end implementation of the SunnyShoots website, built as a pixel-accurate recreation of the approved Figma design. The project is implemented using plain **HTML5, CSS3, and vanilla JavaScript** — no frameworks, no CSS libraries, no build tooling required to run it.

The goal of this codebase is **fidelity and maintainability**: every visual and interactive detail should match the Figma source, and the code should remain easy for any front-end developer to read, extend, and hand off.

> **Status:** Phase 1 — Project foundation only. No sections are visually implemented yet; this phase establishes the scaffolding (file structure, design tokens, base typography, empty semantic sections) that later phases will build upon.

---

## Folder Structure

```
SunnyShoots-Website/
├── index.html
├── assets/
│   ├── images/        # Static images (JPEG/PNG/WebP)
│   ├── videos/         # Video assets (e.g. intro-video section)
│   ├── icons/           # SVG/ICO icons, favicon
│   └── logos/           # Brand + partner logos
├── css/
│   ├── style.css         # Reset, variables, base typography, layout primitives
│   ├── animations.css     # Keyframes and motion/transition utilities
│   └── responsive.css      # Media-query overrides only
├── js/
│   ├── main.js              # Entry point / initialization
│   ├── animations.js         # Scroll-triggered & motion logic
│   └── interactions.js        # User-triggered UI interactivity
└── README.md
```

Each top-level asset folder is organized by media type so assets can be located predictably as the project grows.

---

## Typography

- **Typeface:** [Inter](https://fonts.google.com/specimen/Inter), imported via Google Fonts.
- **Weights loaded:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (Extrabold).
- **Type scale:** Defined via CSS custom properties in `style.css` (`--fs-h1` through `--fs-caption`), using `clamp()` for fluid, responsive heading sizes where appropriate.
- **Line-height scale:** Separate tokens for tight (headings), heading, and body line-heights to keep vertical rhythm consistent.

All font sizing/weight values currently in `style.css` are **placeholder tokens**. They will be replaced with exact values extracted from the Figma file as each section is implemented, but the _system_ (the token names and structure) is final and won't change.

---

## Color Palette

Colors are defined as CSS custom properties in `:root` inside `style.css`:

| Token                    | Purpose                          |
| ------------------------ | -------------------------------- |
| `--color-bg`             | Page background                  |
| `--color-surface`        | Section/card surface background  |
| `--color-text-primary`   | Primary text color               |
| `--color-text-secondary` | Secondary/body text color        |
| `--color-text-inverse`   | Text on dark/colored backgrounds |
| `--color-primary`        | Primary brand color              |
| `--color-accent`         | Accent/highlight color           |
| `--color-border`         | Hairlines, dividers, borders     |

As with typography, current hex values are neutral placeholders. They will be swapped for the exact Figma palette during implementation — no other part of the codebase should need to change when that happens, since all color usage is expected to reference these tokens rather than hard-coded hex values.

---

## Design Philosophy

- **Figma is the single source of truth.** This project does not introduce new layout decisions, spacing choices, or visual treatments beyond what is specified in the design file.
- **Token-driven styling.** Every color, spacing value, font size, and radius is expressed as a CSS variable so the design system stays consistent and centrally editable.
- **Semantic HTML first.** Sections map 1:1 to meaningful `<section>` landmarks (hero, trust, brands, services, etc.) rather than generic `<div>` soup, improving accessibility and maintainability.
- **No premature componentization.** Components (buttons, cards, nav, etc.) are intentionally not built in Phase 1. They will be added section-by-section against the actual Figma specs to avoid guessing at styles that would need to be redone.

---

## Animation Philosophy

- Animations are **separated from layout/typography** into `animations.css` (CSS keyframes/transition utilities) and `animations.js` (scroll-triggered / IntersectionObserver-driven logic).
- Motion tokens (`--duration-fast`, `--duration-base`, `--duration-slow`, `--ease-default`) are defined centrally in `style.css` so all animations share a consistent easing/timing language.
- Animations will be implemented per-component, matching whatever motion is specified or implied by the Figma prototype (entrance transitions, hover states, scroll reveals, etc.), not invented independently.
- `prefers-reduced-motion` support will be respected once animations are implemented, to keep the site accessible.

---

## Responsive Strategy

- **Mobile-first base styles** live in `style.css`; `responsive.css` contains **media-query overrides only**, layered on top as viewport width increases.
- Planned breakpoint reference (to be confirmed against Figma frames):

  | Alias      | Width  |
  | ---------- | ------ |
  | `--bp-sm`  | 480px  |
  | `--bp-md`  | 768px  |
  | `--bp-lg`  | 1024px |
  | `--bp-xl`  | 1280px |
  | `--bp-2xl` | 1440px |

- Layout will use fluid units (`clamp()`, `%`, `rem`) wherever the design supports it, falling back to explicit breakpoints where the Figma design calls for structural changes (e.g. nav collapsing, grid → stack).

---

## Coding Standards

**HTML**

- Semantic elements over generic `<div>`s wherever a meaningful tag exists.
- One `<h1>` per page; heading levels used hierarchically, not for visual sizing.
- All images require descriptive `alt` text once implemented.

**CSS**

- BEM-style naming (`.block__element--modifier`) for component classes once components are introduced.
- No inline styles.
- No hard-coded colors, font sizes, or spacing values — always reference the CSS variables defined in `style.css`.
- `style.css` = structure/tokens/typography. `animations.css` = motion only. `responsive.css` = media queries only. Styles should never leak across these files' responsibilities.

**JavaScript**

- Vanilla JS only, ES6+ syntax.
- No global variable pollution — logic wrapped in functions/modules as needed.
- `main.js` = initialization/orchestration only. `interactions.js` = user-triggered behavior. `animations.js` = scroll/motion-triggered behavior. Logic should live in the file matching its responsibility, not `main.js` by default.
- Code commented where intent isn't self-evident, not line-by-line noise.

**General**

- Commits/changes should be scoped to one section or concern at a time.
- No unused CSS/JS left in the codebase.

---

## File Responsibilities

| File                 | Responsibility                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `index.html`         | Document structure, semantic section scaffolding, asset/script linking                                      |
| `css/style.css`      | CSS reset, design tokens (`:root` variables), base typography, body styles, `.container`, layout primitives |
| `css/animations.css` | `@keyframes` definitions, transition/animation utility classes                                              |
| `css/responsive.css` | Media-query breakpoint overrides only                                                                       |
| `js/main.js`         | App entry point, DOM-ready initialization, orchestration of other JS files                                  |
| `js/animations.js`   | Scroll-triggered animations, IntersectionObservers, motion logic                                            |
| `js/interactions.js` | Click/hover/input-driven interactivity (nav, forms, modals, sliders, etc.)                                  |
| `assets/images`      | Static image assets                                                                                         |
| `assets/videos`      | Video assets                                                                                                |
| `assets/icons`       | Icon and favicon assets                                                                                     |
| `assets/logos`       | Brand and partner logo assets                                                                               |

---

## Roadmap (subsequent phases)

Phase 1 delivers only the project foundation described above. Subsequent phases will implement, section by section and in order, the Hero, Intro Video, Trust, Brands, Featured Work, Services, Process, Testimonials, Portfolio, and Contact sections, plus the Header and Footer — each built to match its corresponding Figma frame exactly, with real design tokens replacing the current placeholders.
