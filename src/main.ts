/* ═══════════════════════════════════════════════════
   Splash Reveal Effect – Standalone TypeScript
   Two images layered; clicks reveal the colored
   version through organic blob-shaped "splashes".
   ═══════════════════════════════════════════════════ */

import './style.css';

// ── Types ───────────────────────────────────────────

interface BackgroundCoverSize {
  backgroundWidth: number;
  backgroundHeight: number;
  offsetX: number;
  offsetY: number;
}

interface SplashData {
  x: number;
  y: number;
  backgroundWidth: number;
  backgroundHeight: number;
  offsetX: number;
  offsetY: number;
  size: number;
  opacity: number;
  shape: number;
  id: number;
  createdAt: number;
  isDayTime: boolean;
  element: HTMLDivElement;
  isFading: boolean;
}

// ── Configuration ───────────────────────────────────

const SPLASH = {
  IMAGE_WIDTH: 1536,
  IMAGE_HEIGHT: 1024,
  get IMAGE_RATIO(): number {
    return this.IMAGE_WIDTH / this.IMAGE_HEIGHT;
  },
  SIZE_RATIO: 0.125,
  LIFETIME_MS: 8000,
  FADE_OUT_DURATION_MS: 500,
  CLEANUP_INTERVAL_MS: 100,
  SHAPE_COUNT: 5,
  DAY_START_HOUR: 9,
  DAY_END_HOUR: 18,
} as const;

const PRIMARY_SPLASH = {
  SIZE_MULTIPLIER: 1.2,
  OPACITY_MIN: 0.6,
  OPACITY_RANGE: 0.3,
} as const;

const SECONDARY_SPLASH = {
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

let activeSplashes: SplashData[] = [];

function getRequiredElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element mit id='${id}' wurde nicht im DOM gefunden.`);
  }
  return element;
}

const heroContainer = getRequiredElement('hero');

// ── Helpers ─────────────────────────────────────────

/** Cover-fit the colored image to the container (same as CSS background-size: cover) */
function calculateBackgroundCoverSize(
  containerWidth: number,
  containerHeight: number,
): BackgroundCoverSize {
  const imageRatio = SPLASH.IMAGE_RATIO;

  if (containerWidth / containerHeight > imageRatio) {
    return {
      backgroundWidth: containerWidth,
      backgroundHeight: containerWidth / imageRatio,
      offsetX: 0,
      offsetY: (containerHeight - containerWidth / imageRatio) / 2,
    };
  }

  return {
    backgroundWidth: containerHeight * imageRatio,
    backgroundHeight: containerHeight,
    offsetX: (containerWidth - containerHeight * imageRatio) / 2,
    offsetY: 0,
  };
}

/** Check if current time falls within daytime hours */
function isDayTime(): boolean {
  const currentHour = new Date().getHours();
  return currentHour >= SPLASH.DAY_START_HOUR && currentHour < SPLASH.DAY_END_HOUR;
}

/** Generate a random shape index (1-based) for splash clip-paths */
function generateRandomShapeIndex(): number {
  return Math.floor(Math.random() * SPLASH.SHAPE_COUNT) + 1;
}

/** Create a splash DOM element and apply positioning & styling */
function createSplashElement(
  splash: Omit<SplashData, 'element' | 'isFading'>,
): HTMLDivElement {
  const element = document.createElement('div');

  const backgroundPositionX = splash.offsetX - splash.x + splash.size / 2;
  const backgroundPositionY = splash.offsetY - splash.y + splash.size / 2;
  const timeClass = splash.isDayTime ? 'day-time' : 'night-time';
  const shapeClass = `splash-shape-${splash.shape}`;

  element.className = `splash ${timeClass} ${shapeClass}`;
  Object.assign(element.style, {
    left: `${splash.x}px`,
    top: `${splash.y}px`,
    width: `${splash.size}px`,
    height: `${splash.size}px`,
    backgroundSize: `${splash.backgroundWidth}px ${splash.backgroundHeight}px`,
    backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
    opacity: `${splash.opacity}`,
  });

  return element;
}

// ── Splash Creation ─────────────────────────────────

/** Build the primary splash data at the exact click position */
function createPrimarySplashData(
  clickX: number,
  clickY: number,
  background: BackgroundCoverSize,
  containerWidth: number,
  isDayTimeNow: boolean,
  timestamp: number,
): Omit<SplashData, 'element' | 'isFading'> {
  const primarySize =
    containerWidth * SPLASH.SIZE_RATIO * PRIMARY_SPLASH.SIZE_MULTIPLIER;
  const primaryOpacity =
    PRIMARY_SPLASH.OPACITY_MIN + Math.random() * PRIMARY_SPLASH.OPACITY_RANGE;

  return {
    x: clickX,
    y: clickY,
    backgroundWidth: background.backgroundWidth,
    backgroundHeight: background.backgroundHeight,
    offsetX: background.offsetX,
    offsetY: background.offsetY,
    size: primarySize,
    opacity: primaryOpacity,
    shape: generateRandomShapeIndex(),
    id: timestamp,
    createdAt: timestamp,
    isDayTime: isDayTimeNow,
  };
}

/** Build secondary splash data radiating outward from the click */
function createSecondarySplashList(
  clickX: number,
  clickY: number,
  background: BackgroundCoverSize,
  containerWidth: number,
  primarySize: number,
  isDayTimeNow: boolean,
  timestamp: number,
): Omit<SplashData, 'element' | 'isFading'>[] {
  const splashCount =
    SECONDARY_SPLASH.COUNT_MIN +
    Math.floor(Math.random() * SECONDARY_SPLASH.COUNT_RANGE);

  const secondarySplashes: Omit<SplashData, 'element' | 'isFading'>[] = [];

  for (let index = 0; index < splashCount; index++) {
    const sizeRatio =
      SECONDARY_SPLASH.SIZE_MIN + Math.random() * SECONDARY_SPLASH.SIZE_RANGE;
    const secondarySize = containerWidth * SPLASH.SIZE_RATIO * sizeRatio;

    // Distribute splashes evenly around the click with slight random jitter
    const angle = (Math.PI * 2 * index) / splashCount + Math.random() * 0.5;
    const distance =
      primarySize *
      (SECONDARY_SPLASH.DISTANCE_MIN +
        Math.random() * SECONDARY_SPLASH.DISTANCE_RANGE);
    const deltaX = Math.cos(angle) * distance;
    const deltaY = Math.sin(angle) * distance;

    const secondaryOpacity =
      SECONDARY_SPLASH.OPACITY_MIN +
      Math.random() * SECONDARY_SPLASH.OPACITY_RANGE;

    secondarySplashes.push({
      x: clickX + deltaX,
      y: clickY + deltaY,
      backgroundWidth: background.backgroundWidth,
      backgroundHeight: background.backgroundHeight,
      offsetX: background.offsetX,
      offsetY: background.offsetY,
      size: secondarySize,
      opacity: secondaryOpacity,
      shape: generateRandomShapeIndex(),
      id: timestamp + index + 1,
      createdAt: timestamp,
      isDayTime: isDayTimeNow,
    });
  }

  return secondarySplashes;
}

/** Add splash data entries to the DOM and the active state array */
function addSplashesToDom(
  splashDataList: Omit<SplashData, 'element' | 'isFading'>[],
): void {
  for (const splashData of splashDataList) {
    const element = createSplashElement(splashData);
    heroContainer.appendChild(element);
    activeSplashes.push({ ...splashData, element, isFading: false });
  }
}

// ── Click Handler ───────────────────────────────────

function handleHeroClick(event: MouseEvent): void {
  const heroRect = heroContainer.getBoundingClientRect();
  const clickX = event.clientX - heroRect.left;
  const clickY = event.clientY - heroRect.top;
  const isDayTimeNow = isDayTime();
  const timestamp = Date.now();

  const background = calculateBackgroundCoverSize(
    heroRect.width,
    heroRect.height,
  );

  const primarySplash = createPrimarySplashData(
    clickX,
    clickY,
    background,
    heroRect.width,
    isDayTimeNow,
    timestamp,
  );

  const secondarySplashes = createSecondarySplashList(
    clickX,
    clickY,
    background,
    heroRect.width,
    primarySplash.size,
    isDayTimeNow,
    timestamp,
  );

  addSplashesToDom([primarySplash, ...secondarySplashes]);
}

heroContainer.addEventListener('click', handleHeroClick);

// ── Lifecycle / Cleanup ─────────────────────────────

/** Remove expired splashes: fade them out first, then remove from DOM */
function cleanupExpiredSplashes(): void {
  const now = Date.now();

  activeSplashes = activeSplashes.filter((splash) => {
    const age = now - splash.createdAt;

    // Start fading when lifetime is up
    if (age >= SPLASH.LIFETIME_MS && !splash.isFading) {
      splash.isFading = true;
      splash.element.classList.add('fading');
    }

    // Remove from DOM after fade-out completes
    if (
      splash.isFading &&
      age >= SPLASH.LIFETIME_MS + SPLASH.FADE_OUT_DURATION_MS
    ) {
      splash.element.remove();
      return false;
    }

    return true;
  });
}

setInterval(cleanupExpiredSplashes, SPLASH.CLEANUP_INTERVAL_MS);

// ── Preload images ──────────────────────────────────

new Image().src = 'img/bg_blank.png';
new Image().src = 'img/bg_colored.png';
new Image().src = 'img/bg_colored_dark.png';
