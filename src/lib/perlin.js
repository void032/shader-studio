// Perlin Noise implementation with FBM support
// Based on classic Perlin noise algorithm

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

// Seeded random number generator
function createRandom(seed) {
  let s = seed || Math.floor(Math.random() * 65536);
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Create Perlin noise function with given seed
export function createPerlin(seed) {
  const rand = createRandom(seed);
  
  // Permutation table
  const p = new Uint8Array(512);
  const permutation = new Uint8Array(256);
  
  // Initialize permutation
  for (let i = 0; i < 256; i++) {
    permutation[i] = i;
  }
  
  // Shuffle
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }
  
  // Extend to 512
  for (let i = 0; i < 512; i++) {
    p[i] = permutation[i & 255];
  }
  
  // 2D Perlin noise
  function perlin2(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = fade(x);
    const v = fade(y);
    
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    
    return lerp(
      lerp(grad(p[p[A]], x, y, 0), grad(p[p[B]], x - 1, y, 0), u),
      lerp(grad(p[p[A + 1]], x, y - 1, 0), grad(p[p[B + 1]], x - 1, y - 1, 0), u),
      v
    );
  }
  
  // 3D Perlin noise
  function perlin3(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);
    
    const A = p[X] + Y;
    const AA = p[A] + Z;
    const AB = p[A + 1] + Z;
    const B = p[X + 1] + Y;
    const BA = p[B] + Z;
    const BB = p[B + 1] + Z;
    
    return lerp(
      lerp(
        lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
        lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u),
        v
      ),
      lerp(
        lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
        lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }
  
  // Fractal Brownian Motion (FBM)
  function fbm2(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += perlin2(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return total / maxValue;
  }
  
  function fbm3(x, y, z, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += perlin3(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return total / maxValue;
  }
  
  return {
    perlin2,
    perlin3,
    fbm2,
    fbm3
  };
}

export default createPerlin;
