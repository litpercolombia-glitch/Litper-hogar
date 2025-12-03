import { BedColor, AspectRatio, ImageSize } from './types';

// Placeholder for the default image (The "Industrial Loft" image you uploaded).
// DEVELOPER: PASTE THE FULL BASE64 STRING OF YOUR IMAGE HERE.
export const DEFAULT_ROOM_TEMPLATE = ""; 

// Lightweight SVG Base64 placeholders so the UI works immediately
const SVG_PREFIX = "data:image/svg+xml;base64,";

// Helper to create atmospheric SVG placeholders
// Fixed to handle Emojis/Unicode correctly in btoa
const getStyledPlaceholder = (colorStart: string, colorEnd: string, text: string, icon: string = "") => {
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colorStart};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colorEnd};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="45%" font-family="sans-serif" font-size="40" fill="rgba(255,255,255,0.3)" text-anchor="middle">${icon}</text>
      <text x="50%" y="60%" font-family="sans-serif" font-weight="bold" font-size="20" fill="white" text-anchor="middle" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">${text}</text>
    </svg>
  `;
  // safely encode unicode string to base64
  return btoa(unescape(encodeURIComponent(svg)));
};

export const ROOM_TEMPLATES = [
  {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Habitación luminosa con paredes blancas, piso de madera clara y decoración simple.',
    base64: `${SVG_PREFIX}${getStyledPlaceholder('#f3f4f6', '#d1d5db', 'Estilo Minimalista', '⬜')}` // White/Gray
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Estilo loft con paredes de ladrillo, ventanales grandes y acentos metálicos negros.',
    base64: `${SVG_PREFIX}${getStyledPlaceholder('#4b5563', '#1f2937', 'Estilo Industrial', '🧱')}` // Dark Grays/Brick
  },
  {
    id: 'nordic',
    name: 'Nórdico',
    description: 'Ambiente acogedor con tonos grises suaves, texturas naturales y luz cálida.',
    base64: `${SVG_PREFIX}${getStyledPlaceholder('#e2e8f0', '#94a3b8', 'Estilo Nórdico', '🌲')}` // Cool Blues/Greys
  },
  {
    id: 'luxury',
    name: 'Lujo Moderno',
    description: 'Habitación elegante con paneles oscuros, iluminación led ambiental y acabados premium.',
    base64: `${SVG_PREFIX}${getStyledPlaceholder('#111827', '#374151', 'Estilo Lujo', '✨')}` // Deep Black/Gold hints
  },
  {
    id: 'boho',
    name: 'Bohemio',
    description: 'Espacio relajado con plantas, alfombras étnicas y tonos tierra cálidos.',
    base64: `${SVG_PREFIX}${getStyledPlaceholder('#d4a373', '#faedcd', 'Estilo Bohemio', '🌿')}` // Warm Earth Tones
  }
];

// Base product description derived from the "Protector de colchón acolchado" JSON specification
const BASE_DESC = "set of a premium quilted mattress protector and 2 matching pillowcases. The design features a uniform small diamond pattern (ultrasonic quilting style) creating a 3D relief texture that looks fluffy and soft. It is a fitted sheet style that tightly covers the top and sides of the mattress. The material has a matte finish with a slight satin sheen.";

export const BED_COLORS: BedColor[] = [
  {
    id: 'mustard',
    name: 'Mostaza',
    hex: '#E1AD01',
    promptTerm: `Mustard Yellow ${BASE_DESC} The color is a rich, warm mustard.`,
    marketingLabel: 'Energía Vital'
  },
  {
    id: 'navy',
    name: 'Azul Oscuro',
    hex: '#000080',
    promptTerm: `Deep Navy Blue ${BASE_DESC} The color is a deep, elegant navy blue.`,
    marketingLabel: 'Profundidad'
  },
  {
    id: 'white',
    name: 'Blanco',
    hex: '#FFFFFF',
    promptTerm: `Pure White ${BASE_DESC} The color is a crisp, clean white with soft shadows showing the quilted texture.`,
    marketingLabel: 'Pureza Total'
  },
  {
    id: 'black',
    name: 'Negro',
    hex: '#111111',
    promptTerm: `Jet Black ${BASE_DESC} The color is a deep black, with light reflecting off the quilted texture to define the diamond shape.`,
    marketingLabel: 'Elegancia'
  },
  {
    id: 'mint',
    name: 'Verde Menta',
    hex: '#98FF98',
    promptTerm: `Soft Mint Green ${BASE_DESC} The color is a fresh, pastel mint green.`,
    marketingLabel: 'Frescura'
  },
  {
    id: 'beige',
    name: 'Beige',
    hex: '#F5F5DC',
    promptTerm: `Warm Beige ${BASE_DESC} The color is a neutral, sandy beige.`,
    marketingLabel: 'Calidez'
  },
  {
    id: 'jade',
    name: 'Verde Jade',
    hex: '#00A86B',
    promptTerm: `Vibrant Jade Green ${BASE_DESC} The color is a rich, jewel-tone jade green.`,
    marketingLabel: 'Naturaleza'
  },
  {
    id: 'lilac',
    name: 'Lila',
    hex: '#C8A2C8',
    promptTerm: `Soft Lilac Purple ${BASE_DESC} The color is a gentle, calming lilac.`,
    marketingLabel: 'Delicadeza'
  },
  {
    id: 'wine',
    name: 'Vino',
    hex: '#722F37',
    promptTerm: `Deep Wine Red (Burgundy) ${BASE_DESC} The color is a dark, romantic wine red.`,
    marketingLabel: 'Pasión'
  },
  {
    id: 'grey',
    name: 'Gris',
    hex: '#808080',
    promptTerm: `Modern Grey ${BASE_DESC} The color is a versatile, medium grey.`,
    marketingLabel: 'Modernidad'
  },
  {
    id: 'salmon',
    name: 'Salmón',
    hex: '#FA8072',
    promptTerm: `Vibrant Salmon Pink ${BASE_DESC} The color is a lively, warm salmon.`,
    marketingLabel: 'Vibrante'
  }
];

export const ASPECT_RATIOS = Object.values(AspectRatio);
export const IMAGE_SIZES = Object.values(ImageSize);

// Models
export const MODEL_EDIT = 'gemini-2.5-flash-image';
export const MODEL_GENERATE_PRO = 'gemini-3-pro-image-preview';
export const MODEL_ANALYZE = 'gemini-3-pro-preview';
export const MODEL_FAST_CHAT = 'gemini-2.5-flash-lite'; // Fast responses