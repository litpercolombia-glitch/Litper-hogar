
export enum Tab {
  VISUALIZER = 'visualizer',
  INSPIRATION = 'inspiration',
  ANALYSIS = 'analysis'
}

export interface BedColor {
  id: string;
  name: string;
  hex: string;
  promptTerm: string; // The specific term for the AI
  marketingLabel: string;
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT_2_3 = '2:3',
  LANDSCAPE_3_2 = '3:2',
  PORTRAIT_3_4 = '3:4',
  LANDSCAPE_4_3 = '4:3',
  PORTRAIT_9_16 = '9:16',
  LANDSCAPE_16_9 = '16:9',
  CINEMATIC_21_9 = '21:9'
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface VisualizerState {
  image: string | null;
  generatedImage: string | null;
  isShowingOriginal: boolean;
  marketingText: string | null;
  selectedColor: BedColor;
}
