import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { createPerlin } from '../lib/perlin';
import { generateTerrainColors } from '../lib/colorPresets';

export function useTerrain() {
  const terrainRef = useRef(null);
  const noiseRef = useRef(null);
  
  // Initialize noise with seed
  const initNoise = useCallback((seed) => {
    noiseRef.current = createPerlin(seed);
  }, []);
  
  // Generate terrain geometry
  const generateTerrain = useCallback((config) => {
    const {
      segments = 100,
      heightScale = 8,
      noiseFreq = 0.05,
      octaves = 4,
      colorPreset = 'grass',
      seed = Math.floor(Math.random() * 65536),
      source = 'perlin'
    } = config;
    
    // Initialize noise
    initNoise(seed);
    const noise = noiseRef.current;
    
    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(
      60, 60,
      segments, segments
    );
    
    // Rotate to lie flat
    geometry.rotateX(-Math.PI / 2);
    
    // Get position attribute
    const positions = geometry.attributes.position.array;
    const vertexCount = positions.length / 3;
    
    // Generate heightmap
    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      
      let height = 0;
      
      if (source === 'perlin') {
        // FBM noise
        height = noise.fbm2(x * noiseFreq, z * noiseFreq, octaves);
      } else if (source === 'island') {
        // Island shape - radial falloff
        const dist = Math.sqrt(x * x + z * z);
        const maxDist = 25;
        const falloff = Math.max(0, 1 - Math.pow(dist / maxDist, 2));
        
        height = noise.fbm2(x * noiseFreq, z * noiseFreq, octaves);
        height = height * falloff - (1 - falloff) * 5;
      }
      
      // Apply height scale
      height *= heightScale;
      
      positions[i * 3 + 1] = height;
    }
    
    // Compute normals
    geometry.computeVertexNormals();
    
    // Generate vertex colors
    const colors = generateTerrainColors(positions, colorPreset, heightScale);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Update bounds
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    
    return geometry;
  }, [initNoise]);
  
  // Create terrain mesh
  const createTerrainMesh = useCallback((config, material = null) => {
    // Dispose old terrain
    if (terrainRef.current) {
      if (terrainRef.current.geometry) {
        terrainRef.current.geometry.dispose();
      }
      if (terrainRef.current.material && terrainRef.current.material !== material) {
        terrainRef.current.material.dispose();
      }
    }
    
    // Generate new geometry
    const geometry = generateTerrain(config);
    
    // Create material if not provided
    const mat = material || new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: config.wireframe || false
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'Terrain';
    
    terrainRef.current = mesh;
    
    // Calculate stats
    const vertCount = geometry.attributes.position.count;
    const triCount = geometry.index ? geometry.index.count / 3 : vertCount / 3;
    
    return {
      mesh,
      vertCount,
      triCount
    };
  }, [generateTerrain]);
  
  // Update terrain material
  const updateTerrainMaterial = useCallback((material) => {
    if (terrainRef.current) {
      const oldMat = terrainRef.current.material;
      terrainRef.current.material = material;
      if (oldMat) oldMat.dispose();
    }
  }, []);
  
  // Update wireframe
  const setWireframe = useCallback((wireframe) => {
    if (terrainRef.current && terrainRef.current.material) {
      terrainRef.current.material.wireframe = wireframe;
    }
  }, []);
  
  // Get terrain mesh
  const getTerrainMesh = useCallback(() => {
    return terrainRef.current;
  }, []);
  
  // Dispose terrain
  const disposeTerrain = useCallback(() => {
    if (terrainRef.current) {
      if (terrainRef.current.geometry) {
        terrainRef.current.geometry.dispose();
      }
      if (terrainRef.current.material) {
        terrainRef.current.material.dispose();
      }
      terrainRef.current = null;
    }
  }, []);
  
  return {
    terrainRef,
    generateTerrain,
    createTerrainMesh,
    updateTerrainMaterial,
    setWireframe,
    getTerrainMesh,
    disposeTerrain,
    noise: noiseRef.current
  };
}

export default useTerrain;
