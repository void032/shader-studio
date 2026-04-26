import { useCallback, useRef } from 'react';
import { createPerlin } from '../lib/perlin';

export function usePerlin(seed) {
  const perlinRef = useRef(null);
  
  // Initialize if not already
  if (!perlinRef.current) {
    perlinRef.current = createPerlin(seed);
  }
  
  // Reinitialize with new seed
  const reseed = useCallback((newSeed) => {
    perlinRef.current = createPerlin(newSeed);
  }, []);
  
  // Get noise value (2D)
  const noise2 = useCallback((x, y) => {
    return perlinRef.current.perlin2(x, y);
  }, []);
  
  // Get noise value (3D)
  const noise3 = useCallback((x, y, z) => {
    return perlinRef.current.perlin3(x, y, z);
  }, []);
  
  // Get FBM value (2D)
  const fbm2 = useCallback((x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) => {
    return perlinRef.current.fbm2(x, y, octaves, persistence, lacunarity);
  }, []);
  
  // Get FBM value (3D)
  const fbm3 = useCallback((x, y, z, octaves = 4, persistence = 0.5, lacunarity = 2.0) => {
    return perlinRef.current.fbm3(x, y, z, octaves, persistence, lacunarity);
  }, []);
  
  return {
    perlin: perlinRef.current,
    reseed,
    noise2,
    noise3,
    fbm2,
    fbm3
  };
}

export default usePerlin;
