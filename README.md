# Splash Reveal Effect

An interactive image reveal effect. Two images are layered on top of each other — clicking anywhere creates organic blob-shaped "splashes" that reveal the colored version beneath a grayscale background.

## How it works

- `bg_blank.png` is displayed as a fullscreen grayscale background
- Clicking spawns 1 primary + 4–9 secondary splash shapes
- Each splash shows a piece of `bg_colored.png` (daytime, 9–18h) or `bg_colored_dark.png` (nighttime), pixel-aligned to create the illusion of "painting" color onto the image
- Splashes fade out after 8 seconds

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production build will be output to `dist/`.
