/**
 * Utility functions for ensuring proper color contrast for accessibility
 */

// Convert hex color to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const bigint = parseInt(hex, 16);
  
  // Handle different hex formats (3 or 6 digits)
  if (hex.length === 3) {
    const r = ((bigint >> 8) & 15) * 17;
    const g = ((bigint >> 4) & 15) * 17;
    const b = (bigint & 15) * 17;
    return { r, g, b };
  } else if (hex.length === 6) {
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  }
  
  return null;
}

// Calculate relative luminance for WCAG contrast calculations
export function getLuminance(color: { r: number; g: number; b: number }): number {
  // Convert RGB to sRGB
  const sRGB = {
    r: color.r / 255,
    g: color.g / 255,
    b: color.b / 255
  };
  
  // Calculate luminance
  const rgb = Object.entries(sRGB).map(([key, value]) => {
    value = value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
    return value;
  });
  
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

// Calculate contrast ratio between two colors
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }
  
  const luminance1 = getLuminance(rgb1);
  const luminance2 = getLuminance(rgb2);
  
  // Calculate contrast ratio
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if contrast meets WCAG AA standard (4.5:1 for normal text, 3:1 for large text)
export function meetsWCAGAA(color1: string, color2: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// Check if contrast meets WCAG AAA standard (7:1 for normal text, 4.5:1 for large text)
export function meetsWCAGAAA(color1: string, color2: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

// Adjust color to meet minimum contrast ratio
export function adjustColorForContrast(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    throw new Error('Invalid color format');
  }
  
  const bgLuminance = getLuminance(bgRgb);
  
  // Determine if we need to lighten or darken the foreground
  const shouldLighten = bgLuminance < 0.5;
  
  // Start with the original color
  let adjustedRgb = { ...fgRgb };
  let currentRatio = getContrastRatio(foreground, background);
  
  // Maximum iterations to prevent infinite loops
  const maxIterations = 100;
  let iterations = 0;
  
  // Adjust color until we meet the target ratio or reach max iterations
  while (currentRatio < targetRatio && iterations < maxIterations) {
    if (shouldLighten) {
      // Lighten the color
      adjustedRgb.r = Math.min(255, adjustedRgb.r + 1);
      adjustedRgb.g = Math.min(255, adjustedRgb.g + 1);
      adjustedRgb.b = Math.min(255, adjustedRgb.b + 1);
    } else {
      // Darken the color
      adjustedRgb.r = Math.max(0, adjustedRgb.r - 1);
      adjustedRgb.g = Math.max(0, adjustedRgb.g - 1);
      adjustedRgb.b = Math.max(0, adjustedRgb.b - 1);
    }
    
    // Convert back to hex to calculate new ratio
    const adjustedHex = rgbToHex(adjustedRgb);
    currentRatio = getContrastRatio(adjustedHex, background);
    iterations++;
  }
  
  return rgbToHex(adjustedRgb);
}

// Convert RGB to hex
export function rgbToHex(color: { r: number; g: number; b: number }): string {
  return '#' + [color.r, color.g, color.b]
    .map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

// Get accessible text color based on background
export function getAccessibleTextColor(backgroundColor: string): string {
  const bgRgb = hexToRgb(backgroundColor);
  
  if (!bgRgb) {
    return '#000000'; // Default to black if invalid color
  }
  
  const bgLuminance = getLuminance(bgRgb);
  
  // Use white text on dark backgrounds, black text on light backgrounds
  return bgLuminance > 0.5 ? '#000000' : '#FFFFFF';
}
