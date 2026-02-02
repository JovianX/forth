/**
 * Color utility functions for deriving colors from container colors
 * These functions ensure containers use their own color palette independently of theme colors
 */

/**
 * Convert hex color to RGB values
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Convert RGB to hex
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Convert hex to rgba string
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

/**
 * Calculate relative luminance (brightness) of a color
 * Returns a value between 0 (dark) and 1 (light)
 */
export const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  // Convert RGB to relative luminance using sRGB formula
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Determine if text should be white or black based on background color
 */
export const getContrastTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  // Use white text on dark backgrounds (luminance < 0.5), black on light
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Lighten a color by a percentage
 */
export const lighten = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = percent / 100;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));

  return rgbToHex(r, g, b);
};

/**
 * Darken a color by a percentage
 */
export const darken = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = percent / 100;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));

  return rgbToHex(r, g, b);
};

/**
 * Get a light variant of a container color (for backgrounds)
 */
export const getContainerLightColor = (containerColor: string): string => {
  // Create a very light version (around 90-95% lighter)
  return lighten(containerColor, 90);
};

/**
 * Get a medium-light variant of a container color (for hover states)
 */
export const getContainerHoverColor = (containerColor: string): string => {
  // Create a light version (around 85% lighter)
  return lighten(containerColor, 85);
};

/**
 * Get a dark variant of a container color (for text/icons)
 */
export const getContainerDarkColor = (containerColor: string): string => {
  // Darken by 20-30% for better contrast
  return darken(containerColor, 25);
};

/**
 * Get a semi-transparent version of a container color
 */
export const getContainerColorWithOpacity = (containerColor: string, opacity: number): string => {
  return hexToRgba(containerColor, opacity);
};

/**
 * Get appropriate text color for a container (black or white)
 */
export const getContainerTextColor = (containerColor: string): string => {
  return getContrastTextColor(containerColor);
};

/**
 * Get border color for a container (semi-transparent version)
 */
export const getContainerBorderColor = (containerColor: string, opacity: number = 0.3): string => {
  return hexToRgba(containerColor, opacity);
};

/**
 * Calculate color distance using Euclidean distance in RGB space
 * Returns a value between 0 (identical) and ~441 (max distance)
 */
export const getColorDistance = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return Infinity;
  
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Convert RGB to HSL
 */
export const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s, l };
};

/**
 * Calculate perceptual color distance using HSL space
 * This better matches human perception, especially for hue differences
 */
export const getPerceptualColorDistance = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return Infinity;
  
  const hsl1 = rgbToHsl(rgb1.r, rgb1.g, rgb1.b);
  const hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);
  
  // Calculate hue difference (circular - 0 and 360 are the same)
  let hueDiff = Math.abs(hsl1.h - hsl2.h);
  if (hueDiff > 180) {
    hueDiff = 360 - hueDiff;
  }
  
  // Normalize hue difference to 0-1
  const normalizedHueDiff = hueDiff / 180;
  
  // Calculate saturation and lightness differences
  const satDiff = Math.abs(hsl1.s - hsl2.s);
  const lightDiff = Math.abs(hsl1.l - hsl2.l);
  
  // Weight hue difference more heavily (humans notice hue differences more)
  // Use a weighted combination: hue is most important, then saturation, then lightness
  return Math.sqrt(
    normalizedHueDiff * normalizedHueDiff * 3 +  // Hue weight: 3
    satDiff * satDiff * 2 +                        // Saturation weight: 2
    lightDiff * lightDiff                          // Lightness weight: 1
  );
};

/**
 * Minimum perceptual distance threshold to consider colors "different enough"
 * Values range from 0 (identical) to ~2.4 (max distance)
 * We want at least 0.4 for clearly distinguishable colors
 */
const MIN_COLOR_DISTANCE_THRESHOLD = 0.4;

/**
 * Find the color from a palette that is maximally different from existing colors
 * Returns the color with the maximum minimum distance to all used colors
 * Enforces a minimum distance threshold to ensure visual distinction
 * 
 * @param availableColors - Colors to choose from
 * @param priorityColors - Colors to prioritize avoiding (e.g., recent containers)
 * @param allUsedColors - All used colors for overall diversity check
 */
export const findMostDifferentColor = (
  availableColors: string[],
  priorityColors: string[],
  allUsedColors?: string[]
): string => {
  const usedColors = priorityColors.length > 0 ? priorityColors : (allUsedColors || []);
  const allColors = allUsedColors || priorityColors;
  
  if (availableColors.length === 0) return '#6B7280'; // Default gray
  
  // If no colors are used yet, return the first available color
  if (usedColors.length === 0) {
    return availableColors[0];
  }
  
  // Find unused colors first (check against all used colors, not just priority)
  const unusedColors = availableColors.filter(
    color => !allColors.includes(color)
  );
  
  // If all colors are used, we'll need to pick from all available colors
  const colorsToCheck = unusedColors.length > 0 ? unusedColors : availableColors;
  
  let bestColor = colorsToCheck[0];
  let maxMinDistance = 0;
  
  // For each candidate color, find its minimum distance to any used color
  colorsToCheck.forEach(candidateColor => {
    let minDistance = Infinity;
    
    usedColors.forEach(usedColor => {
      const distance = getPerceptualColorDistance(candidateColor, usedColor);
      if (distance < minDistance) {
        minDistance = distance;
      }
    });
    
    // If this color is more different from all used colors, select it
    if (minDistance > maxMinDistance) {
      maxMinDistance = minDistance;
      bestColor = candidateColor;
    }
  });
  
  // If the best color doesn't meet the minimum distance threshold,
  // try to find a better alternative or generate a new color
  if (maxMinDistance < MIN_COLOR_DISTANCE_THRESHOLD && usedColors.length > 0) {
    // Try to find a color that's at least somewhat different
    // by looking for colors with maximum average distance
    let bestAverageDistance = 0;
    let bestAverageColor = bestColor;
    
    colorsToCheck.forEach(candidateColor => {
      let totalDistance = 0;
      
      usedColors.forEach(usedColor => {
        totalDistance += getPerceptualColorDistance(candidateColor, usedColor);
      });
      
      const averageDistance = totalDistance / usedColors.length;
      
      if (averageDistance > bestAverageDistance) {
        bestAverageDistance = averageDistance;
        bestAverageColor = candidateColor;
      }
    });
    
    // If we still can't find a good color, generate one that's maximally different
    if (bestAverageDistance < MIN_COLOR_DISTANCE_THRESHOLD) {
      return generateDistinctColor(usedColors);
    }
    
    return bestAverageColor;
  }
  
  return bestColor;
};

/**
 * Generate a new color that is maximally different from existing colors
 * Uses HSL color space to ensure good hue separation
 */
export const generateDistinctColor = (existingColors: string[]): string => {
  if (existingColors.length === 0) {
    return '#3B82F6'; // Default blue
  }
  
  // Collect all hues from existing colors
  const existingHues: number[] = [];
  existingColors.forEach(color => {
    const rgb = hexToRgb(color);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      existingHues.push(hsl.h);
    }
  });
  
  // Find the largest gap in hue space
  existingHues.sort((a, b) => a - b);
  
  let maxGap = 0;
  let bestHue = 0;
  
  // Check gaps between consecutive hues
  for (let i = 0; i < existingHues.length; i++) {
    const nextHue = existingHues[(i + 1) % existingHues.length];
    let gap;
    
    if (i === existingHues.length - 1) {
      // Wrap around
      gap = (360 - existingHues[i] + nextHue) / 2;
      bestHue = (existingHues[i] + gap) % 360;
    } else {
      gap = (nextHue - existingHues[i]) / 2;
      bestHue = existingHues[i] + gap;
    }
    
    if (gap > maxGap) {
      maxGap = gap;
      bestHue = existingHues[i] + gap;
      if (bestHue > 360) bestHue -= 360;
    }
  }
  
  // Use a vibrant saturation (0.7) and medium lightness (0.5) for good visibility
  const hsl = { h: bestHue, s: 0.7, l: 0.5 };
  
  // Convert HSL back to RGB
  return hslToHex(hsl.h, hsl.s, hsl.l);
};

/**
 * Convert HSL to hex
 */
export const hslToHex = (h: number, s: number, l: number): string => {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hNorm = h / 360;
    
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }
  
  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
};
