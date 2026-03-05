/* ═══════════════════════════════════════════════════
   Splash Reveal Effect – Standalone TypeScript
   Two images layered; clicks reveal the colored
   version through organic blob-shaped "splashes".
   ═══════════════════════════════════════════════════ */

import './style.css';

// ── Types ───────────────────────────────────────────

interface BgSize {
  bgW: number;
  bgH: number;
  ox: number;
  oy: number;
}

interface SplashData {
  x: number;
  y: number;
  bgW: number;
  bgH: number;
  ox: number;
  oy: number;
  size: number;
  opacity: number;
  shape: number;
  id: number;
  created: number;
  day: boolean;
  el: HTMLDivElement;
  fading: boolean;
}

// ── Configuration ───────────────────────────────────

const SPLASH = {
  IMAGE_WIDTH: 1536,
  IMAGE_HEIGHT: 1024,
  get IMAGE_RATIO(): number {
    return this.IMAGE_WIDTH / this.IMAGE_HEIGHT;
  },
  SIZE_RATIO: 0.125,
  LIFETIME: 8000,
  FADE_OUT_DURATION: 500,
  CLEANUP_INTERVAL: 100,
  SHAPE_COUNT: 5,
  DAY_START_HOUR: 9,
  DAY_END_HOUR: 18,
} as const;

const PRIMARY = {
  SIZE_MULTIPLIER: 1.2,
  OPACITY_MIN: 0.6,
  OPACITY_RANGE: 0.3,
} as const;

const SECONDARY = {
  COUNT_MIN: 4,
  COUNT_RANGE: 5,
  SIZE_MIN: 0.3,
  SIZE_RANGE: 0.4,
  DISTANCE_MIN: 0.3,
  DISTANCE_RANGE: 0.5,
  OPACITY_MIN: 0.2,
  OPACITY_RANGE: 0.5,
} as const;

// ── State ───────────────────────────────────────────

let splashes: SplashData[] = [];
const hero = document.getElementById('hero')!;

// ── Helpers ─────────────────────────────────────────

/** Cover-fit the colored image to the container (same as CSS background-size: cover) */
function calcBgSize(cw: number, ch: number): BgSize {
  const ratio = SPLASH.IMAGE_RATIO;
  if (cw / ch > ratio) {
    return { bgW: cw, bgH: cw / ratio, ox: 0, oy: (ch - cw / ratio) / 2 };
  }
  return { bgW: ch * ratio, bgH: ch, ox: (cw - ch * ratio) / 2, oy: 0 };
}

/** Check if it's daytime right now */
function isDayTime(): boolean {
  const h = new Date().getHours();
  return h >= SPLASH.DAY_START_HOUR && h < SPLASH.DAY_END_HOUR;
}

/** Create a splash DOM element */
function makeSplashEl(s: Omit<SplashData, 'el' | 'fading'>): HTMLDivElement {
  const el = document.createElement('div');
  const bgPosX = s.ox - s.x + s.size / 2;
  const bgPosY = s.oy - s.y + s.size / 2;
  const timeClass = s.day ? 'day-time' : 'night-time';
  const shapeClass = `splash-shape-${s.shape}`;

  el.className = `splash ${timeClass} ${shapeClass}`;
  Object.assign(el.style, {
    left: `${s.x}px`,
    top: `${s.y}px`,
    width: `${s.size}px`,
    height: `${s.size}px`,
    backgroundSize: `${s.bgW}px ${s.bgH}px`,
    backgroundPosition: `${bgPosX}px ${bgPosY}px`,
    opacity: `${s.opacity}`,
  });

  return el;
}

// ── Click Handler ───────────────────────────────────

hero.addEventListener('click', (e: MouseEvent) => {
  const rect = hero.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const day = isDayTime();

  const { bgW, bgH, ox, oy } = calcBgSize(rect.width, rect.height);

  const newSplashes: Omit<SplashData, 'el' | 'fading'>[] = [];

  // Primary splash at click point
  const pSize = rect.width * SPLASH.SIZE_RATIO * PRIMARY.SIZE_MULTIPLIER;
  const pOpacity = PRIMARY.OPACITY_MIN + Math.random() * PRIMARY.OPACITY_RANGE;
  const pShape = Math.floor(Math.random() * SPLASH.SHAPE_COUNT) + 1;

  newSplashes.push({
    x: cx, y: cy,
    bgW, bgH, ox, oy,
    size: pSize, opacity: pOpacity, shape: pShape,
    id: Date.now(), created: Date.now(), day,
  });

  // Secondary splashes radiating outward
  const count = SECONDARY.COUNT_MIN + Math.floor(Math.random() * SECONDARY.COUNT_RANGE);
  for (let i = 0; i < count; i++) {
    const sRatio = SECONDARY.SIZE_MIN + Math.random() * SECONDARY.SIZE_RANGE;
    const sSize = rect.width * SPLASH.SIZE_RATIO * sRatio;
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = pSize * (SECONDARY.DISTANCE_MIN + Math.random() * SECONDARY.DISTANCE_RANGE);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const sOp = SECONDARY.OPACITY_MIN + Math.random() * SECONDARY.OPACITY_RANGE;
    const sShape = Math.floor(Math.random() * SPLASH.SHAPE_COUNT) + 1;

    newSplashes.push({
      x: cx + dx, y: cy + dy,
      bgW, bgH, ox, oy,
      size: sSize, opacity: sOp, shape: sShape,
      id: Date.now() + i + 1, created: Date.now(), day,
    });
  }

  // Add to DOM & state
  for (const s of newSplashes) {
    const el = makeSplashEl(s);
    hero.appendChild(el);
    splashes.push({ ...s, el, fading: false });
  }
});

// ── Lifecycle / Cleanup ─────────────────────────────

setInterval(() => {
  const now = Date.now();
  splashes = splashes.filter((s) => {
    const age = now - s.created;

    // Start fading when lifetime is up
    if (age >= SPLASH.LIFETIME && !s.fading) {
      s.fading = true;
      s.el.classList.add('fading');
    }

    // Remove from DOM after fade-out completes
    if (s.fading && age >= SPLASH.LIFETIME + SPLASH.FADE_OUT_DURATION) {
      s.el.remove();
      return false;
    }

    return true;
  });
}, SPLASH.CLEANUP_INTERVAL);

// ── Preload images ──────────────────────────────────

new Image().src = 'img/bg_blank.png';
new Image().src = 'img/bg_colored.png';
new Image().src = 'img/bg_colored_dark.png';
