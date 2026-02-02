import type { ColorPalette } from '../components/ColorPalettePreview';

const PALETTE_STORAGE_KEY = 'selectedColorPalette';

export const savePalette = (palette: ColorPalette): void => {
  localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(palette));
};

export const getPalette = (): ColorPalette | null => {
  const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ColorPalette;
  } catch {
    return null;
  }
};

export const updateContainerColors = (containerColors: string[]): void => {
  // This will be used to update the container colors in taskUtils
  localStorage.setItem('containerColors', JSON.stringify(containerColors));
};

export const getContainerColors = (): string[] => {
  const stored = localStorage.getItem('containerColors');
  if (!stored) return [];
  try {
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
};
