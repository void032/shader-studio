// Color Presets for Terrain Generation

export const COLOR_PRESETS = {
  grass: {
    name: 'Grassland',
    colors: [
      { pos: 0.0, color: [0.15, 0.35, 0.1] },      // Dark green (low)
      { pos: 0.3, color: [0.3, 0.6, 0.2] },        // Medium green
      { pos: 0.5, color: [0.5, 0.7, 0.3] },        // Light green
      { pos: 0.7, color: [0.6, 0.55, 0.35] },      // Brown (rock)
      { pos: 0.9, color: [0.8, 0.8, 0.85] },       // Light gray (snow)
      { pos: 1.0, color: [1.0, 1.0, 1.0] }         // White (peak)
    ]
  },
  rock: {
    name: 'Rocky Mountain',
    colors: [
      { pos: 0.0, color: [0.2, 0.18, 0.15] },      // Dark brown (low)
      { pos: 0.25, color: [0.35, 0.3, 0.25] },     // Brown
      { pos: 0.5, color: [0.5, 0.48, 0.42] },      // Tan
      { pos: 0.75, color: [0.65, 0.63, 0.58] },    // Light gray
      { pos: 1.0, color: [0.9, 0.9, 0.92] }        // White (peak)
    ]
  },
  desert: {
    name: 'Desert',
    colors: [
      { pos: 0.0, color: [0.75, 0.6, 0.35] },      // Sand (low)
      { pos: 0.3, color: [0.85, 0.7, 0.4] },       // Light sand
      { pos: 0.5, color: [0.9, 0.75, 0.45] },      // Bright sand
      { pos: 0.7, color: [0.7, 0.5, 0.3] },        // Orange rock
      { pos: 0.85, color: [0.55, 0.4, 0.25] },     // Dark rock
      { pos: 1.0, color: [0.8, 0.78, 0.75] }       // White cap
    ]
  },
  ice: {
    name: 'Arctic Ice',
    colors: [
      { pos: 0.0, color: [0.1, 0.15, 0.25] },      // Deep blue (ocean)
      { pos: 0.2, color: [0.2, 0.35, 0.5] },       // Blue ice
      { pos: 0.4, color: [0.4, 0.6, 0.7] },        // Light blue
      { pos: 0.6, color: [0.65, 0.8, 0.85] },      // Cyan ice
      { pos: 0.8, color: [0.85, 0.9, 0.95] },      // White-blue
      { pos: 1.0, color: [1.0, 1.0, 1.0] }         // Pure white
    ]
  },
  neon: {
    name: 'Neon Cyber',
    colors: [
      { pos: 0.0, color: [0.05, 0.02, 0.1] },      // Deep purple (low)
      { pos: 0.2, color: [0.15, 0.05, 0.25] },     // Purple
      { pos: 0.4, color: [0.3, 0.1, 0.5] },        // Magenta
      { pos: 0.6, color: [0.5, 0.2, 0.6] },        // Pink-purple
      { pos: 0.8, color: [0.7, 0.3, 0.7] },        // Pink
      { pos: 1.0, color: [1.0, 0.5, 0.8] }         // Hot pink (peak)
    ]
  },
  mars: {
    name: 'Mars Red',
    colors: [
      { pos: 0.0, color: [0.35, 0.15, 0.1] },      // Dark red (low)
      { pos: 0.25, color: [0.55, 0.25, 0.15] },    // Red-brown
      { pos: 0.5, color: [0.7, 0.35, 0.2] },       // Orange-red
      { pos: 0.75, color: [0.8, 0.5, 0.3] },       // Orange
      { pos: 1.0, color: [0.9, 0.7, 0.5] }         // Light orange (peak)
    ]
  }
};

// Linear interpolation between two values
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Get color from gradient at position t (0-1)
export function getGradientColor(presetKey, t) {
  const preset = COLOR_PRESETS[presetKey];
  if (!preset) return [0.5, 0.5, 0.5];
  
  const colors = preset.colors;
  
  // Find the two color stops
  for (let i = 0; i < colors.length - 1; i++) {
    const curr = colors[i];
    const next = colors[i + 1];
    
    if (t >= curr.pos && t <= next.pos) {
      const localT = (t - curr.pos) / (next.pos - curr.pos);
      return [
        lerp(curr.color[0], next.color[0], localT),
        lerp(curr.color[1], next.color[1], localT),
        lerp(curr.color[2], next.color[2], localT)
      ];
    }
  }
  
  // Return first or last color if out of range
  if (t <= colors[0].pos) return colors[0].color;
  return colors[colors.length - 1].color;
}

// Generate vertex colors for terrain based on height
export function generateTerrainColors(positions, presetKey, heightScale) {
  const colors = new Float32Array(positions.length);
  const colorCount = positions.length / 3;
  
  // Find height range
  let minY = Infinity;
  let maxY = -Infinity;
  
  for (let i = 0; i < colorCount; i++) {
    const y = positions[i * 3 + 1];
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  
  const heightRange = maxY - minY || 1;
  
  for (let i = 0; i < colorCount; i++) {
    const y = positions[i * 3 + 1];
    const t = (y - minY) / heightRange;
    const color = getGradientColor(presetKey, t);
    
    colors[i * 3] = color[0];
    colors[i * 3 + 1] = color[1];
    colors[i * 3 + 2] = color[2];
  }
  
  return colors;
}

export default COLOR_PRESETS;
