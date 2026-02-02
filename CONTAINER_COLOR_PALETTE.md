# Container Color Palette

This document shows the current container color palette used by the application.

## Default Container Colors

The default palette consists of **12 colors** evenly distributed across the HSL hue spectrum (every 30 degrees) for maximum visual distinction:

| # | Color | Hex Code | HSL Hue | Name | Preview |
|---|-------|----------|---------|------|---------|
| 1 | 🔴 | `#EF4444` | 0° | Red - vibrant | <span style="background-color: #EF4444; color: white; padding: 4px 8px; border-radius: 4px;">Red</span> |
| 2 | 🟠 | `#F97316` | 30° | Orange - warm | <span style="background-color: #F97316; color: white; padding: 4px 8px; border-radius: 4px;">Orange</span> |
| 3 | 🟡 | `#F59E0B` | 60° | Amber - golden | <span style="background-color: #F59E0B; color: white; padding: 4px 8px; border-radius: 4px;">Amber</span> |
| 4 | 🟡 | `#EAB308` | 90° | Yellow - bright | <span style="background-color: #EAB308; color: black; padding: 4px 8px; border-radius: 4px;">Yellow</span> |
| 5 | 🟢 | `#84CC16` | 120° | Lime - fresh green | <span style="background-color: #84CC16; color: black; padding: 4px 8px; border-radius: 4px;">Lime</span> |
| 6 | 🟢 | `#10B981` | 150° | Emerald - natural | <span style="background-color: #10B981; color: white; padding: 4px 8px; border-radius: 4px;">Emerald</span> |
| 7 | 🔵 | `#14B8A6` | 180° | Teal - balanced | <span style="background-color: #14B8A6; color: white; padding: 4px 8px; border-radius: 4px;">Teal</span> |
| 8 | 🔵 | `#06B6D4` | 210° | Cyan - cool | <span style="background-color: #06B6D4; color: white; padding: 4px 8px; border-radius: 4px;">Cyan</span> |
| 9 | 🔵 | `#3B82F6` | 240° | Blue - deep | <span style="background-color: #3B82F6; color: white; padding: 4px 8px; border-radius: 4px;">Blue</span> |
| 10 | 🟣 | `#6366F1` | 270° | Indigo - rich | <span style="background-color: #6366F1; color: white; padding: 4px 8px; border-radius: 4px;">Indigo</span> |
| 11 | 🟣 | `#8B5CF6` | 300° | Purple - creative | <span style="background-color: #8B5CF6; color: white; padding: 4px 8px; border-radius: 4px;">Purple</span> |
| 12 | 🩷 | `#EC4899` | 330° | Pink - energetic | <span style="background-color: #EC4899; color: white; padding: 4px 8px; border-radius: 4px;">Pink</span> |

## Visual Color Wheel

```
     Red (0°)
        🔴
        |
Pink (330°)  |  Orange (30°)
    🩷       |       🟠
        |
        |
Purple (300°) |  Amber (60°)
    🟣       |       🟡
        |
        |
Indigo (270°) |  Yellow (90°)
    🟣       |       🟡
        |
        |
Blue (240°)  |  Lime (120°)
    🔵       |       🟢
        |
        |
Cyan (210°)  |  Emerald (150°)
    🔵       |       🟢
        |
        |
     Teal (180°)
        🔵
```

## How Colors Are Selected

1. **Priority System**: The algorithm prioritizes avoiding colors similar to the **5 most recently created containers**
2. **Distance Calculation**: Uses HSL color space with hue weighted 3x more than saturation/lightness
3. **Minimum Threshold**: Ensures colors have at least 0.4 perceptual distance (on a scale of 0-2.4)
4. **Fallback**: If no palette color meets the threshold, generates a new color that fills the largest gap in hue space

## Customization

The container color palette can be customized by:

1. **Selecting a Theme**: Use the color palette preview (`?previewColors=true` in URL or via the UI)
   - Each theme includes its own container color palette
   - Themes: Golden Sunrise, Ocean Sunrise, Forest Dawn, Lavender Twilight, Navy Professional, Modern Monochrome

2. **Storage**: 
   - Saved in `localStorage` under the key `containerColors`
   - If no custom palette is saved, uses the default palette above

## Current Active Palette

The application uses:
- **Default palette** (if no custom palette is saved)
- **Custom palette** from localStorage (if a theme has been applied)

To see which palette is currently active, check the browser's localStorage or create a new container to see which colors are being used.
