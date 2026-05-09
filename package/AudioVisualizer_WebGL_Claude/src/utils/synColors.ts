/**
 * Synesthetic frequency-to-color mapping.
 * Anchors based on documented chromesthesia research:
 * sub-bass → indigo, bass → crimson, low-mid → amber,
 * mid → gold, upper-mid → green, high → cyan→blue, presence → violet, air → magenta/white.
 */

type RGB = [number, number, number];

interface Anchor { hz: number; rgb: RGB }

const ANCHORS: Anchor[] = [
  { hz: 20,    rgb: [8,   4,   45]  },  // deep indigo-black
  { hz: 80,    rgb: [45,  0,   130] },  // violet
  { hz: 150,   rgb: [170, 0,   25]  },  // crimson
  { hz: 300,   rgb: [200, 70,  0]   },  // orange-red
  { hz: 600,   rgb: [185, 140, 0]   },  // amber/gold
  { hz: 1200,  rgb: [70,  185, 0]   },  // lime-green
  { hz: 2500,  rgb: [0,   175, 120] },  // cyan-green
  { hz: 5000,  rgb: [0,   115, 220] },  // sky blue
  { hz: 9000,  rgb: [75,  25,  215] },  // blue-violet
  { hz: 14000, rgb: [175, 0,   175] },  // violet-magenta
  { hz: 18000, rgb: [215, 70,  195] },  // bright pink
  { hz: 20000, rgb: [235, 215, 255] },  // near-white, pinkish
];

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Map a frequency in Hz to an RGB color tuple using log-interpolation
 * between synesthetic color anchors.
 */
export function freqToSynColor(hz: number): RGB {
  hz = Math.max(20, Math.min(20000, hz));
  const logHz = Math.log2(hz);

  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[i + 1];
    const logA = Math.log2(a.hz);
    const logB = Math.log2(b.hz);

    if (logHz <= logB) {
      const raw = (logHz - logA) / (logB - logA);
      const t = smoothstep(Math.max(0, Math.min(1, raw)));
      return [
        Math.round(a.rgb[0] + t * (b.rgb[0] - a.rgb[0])),
        Math.round(a.rgb[1] + t * (b.rgb[1] - a.rgb[1])),
        Math.round(a.rgb[2] + t * (b.rgb[2] - a.rgb[2])),
      ];
    }
  }
  return ANCHORS[ANCHORS.length - 1].rgb;
}

/** Map Hz to a hex color string. */
export function synColorHex(hz: number): string {
  const [r, g, b] = freqToSynColor(hz);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Brighter variant of synColorHex suited for creature body fills.
 * Boosts luminance so the color is visible against the dark background.
 */
export function synColorHexBright(hz: number): string {
  const [r, g, b] = freqToSynColor(hz);
  const boost = 1.9;
  const br = Math.min(255, Math.round(r * boost + 30));
  const bg = Math.min(255, Math.round(g * boost + 20));
  const bb = Math.min(255, Math.round(b * boost + 30));
  return '#' + [br, bg, bb].map(v => v.toString(16).padStart(2, '0')).join('');
}
