import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { PRESETS, getPresetById } from '../lib/shaderPresets';

// Target types
export const TARGET_TYPES = {
  TERRAIN: 'terrain',
  GLB: 'glb',
  PRIMITIVE: 'primitive'
};

// Primitive shapes
export const PRIMITIVE_SHAPES = {
  BOX: 'box',
  SPHERE: 'sphere',
  TORUS: 'torus',
  TORUS_KNOT: 'torusKnot',
  CYLINDER: 'cylinder',
  CONE: 'cone'
};
export { getPresetById };
// Create context
const StudioContext = createContext(null);

// Provider component
export function StudioProvider({ children }) {
  // Scene state
  const [activeTarget, setActiveTarget] = useState({
    type: TARGET_TYPES.TERRAIN,
    mesh: null,
    name: 'Terrain',
    vertCount: 0,
    triCount: 0
  });
  
  // Terrain config
  const [terrainConfig, setTerrainConfig] = useState({
    source: 'perlin',
    segments: 100,
    heightScale: 8,
    noiseFreq: 0.05,
    octaves: 4,
    colorPreset: 'grass',
    seed: Math.floor(Math.random() * 65536),
    wireframe: false
  });
  
  // Primitive config
  const [primitiveConfig, setPrimitiveConfig] = useState({
    shape: PRIMITIVE_SHAPES.SPHERE,
    radius: 3,
    width: 3,
    height: 3,
    depth: 3,
    tube: 1,
    p: 2,
    q: 3,
    widthSegments: 32,
    heightSegments: 32,
    radialSegments: 16,
    tubularSegments: 64
  });
  
  // GLB data
  const [glbData, setGlbData] = useState(null);
  
  // Shader state
  const [usingCustomShader, setUsingCustomShader] = useState(false);
  const [activePresetId, setActivePresetId] = useState('height_gradient');
  const preset = getPresetById('height_gradient');
  const [vertSrc, setVertSrc] = useState(preset.vert);
  const [fragSrc, setFragSrc] = useState(preset.frag);
  const [shaderError, setShaderError] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  
  // UI Uniforms (mirrored from uniformsRef for UI display)
  const [uiUniforms, setUiUniforms] = useState({
    timeScale: 1.0,
    warp: 0.0,
    brightness: 1.0,
    steps: 4,
    threshold: 0.5,
    freq: 3.0,
    color1: '#4fffb0',
    color2: '#0a0020',
    color3: '#ff6b6b'
  });
  
  // Uniforms ref (shared by all shader materials)
  const uniformsRef = useRef({
    u_time: { value: 0 },
    u_timeScale: { value: 1.0 },
    u_warp: { value: 0.0 },
    u_brightness: { value: 1.0 },
    u_steps: { value: 4.0 },
    u_threshold: { value: 0.5 },
    u_freq: { value: 3.0 },
    u_color1: { value: new THREE.Color('#4fffb0') },
    u_color2: { value: new THREE.Color('#0a0020') },
    u_color3: { value: new THREE.Color('#ff6b6b') },
    u_heightScale: { value: 8.0 }
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('scene');
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ verts: 0, tris: 0 });
  const [codeFormat, setCodeFormat] = useState('threejs');
  
  // Update uniform value
  const updateUniform = useCallback((name, value) => {
    if (uniformsRef.current[name]) {
      if (name.startsWith('u_color')) {
        uniformsRef.current[name].value.set(value);
      } else {
        uniformsRef.current[name].value = value;
      }
    }
  }, []);
  
  // Update UI uniform and ref
  const updateUiUniform = useCallback((name, value) => {
    setUiUniforms(prev => ({ ...prev, [name]: value }));
    const uniformName = `u_${name}`;
    updateUniform(uniformName, value);
  }, [updateUniform]);
  
  // Show toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  
  // Load preset
  const loadPreset = useCallback((presetId) => {
    const preset = getPresetById(presetId);
    setActivePresetId(presetId);
    setVertSrc(preset.vert);
    setFragSrc(preset.frag);
    
    // Apply default uniforms
    if (preset.defaultUniforms) {
      Object.entries(preset.defaultUniforms).forEach(([key, value]) => {
        if (key.startsWith('u_')) {
          const uiKey = key.slice(2);
          if (uiKey in uiUniforms) {
            setUiUniforms(prev => ({ ...prev, [uiKey]: value }));
            updateUniform(key, value);
          }
        }
      });
    }
  }, [uiUniforms, updateUniform]);
  
  // Context value
  const value = {
    // Scene
    activeTarget,
    setActiveTarget,
    TARGET_TYPES,
    
    // Terrain
    terrainConfig,
    setTerrainConfig,
    
    // Primitive
    primitiveConfig,
    setPrimitiveConfig,
    PRIMITIVE_SHAPES,
    
    // GLB
    glbData,
    setGlbData,
    
    // Shader
    usingCustomShader,
    setUsingCustomShader,
    activePresetId,
    setActivePresetId,
    vertSrc,
    setVertSrc,
    fragSrc,
    setFragSrc,
    shaderError,
    setShaderError,
    isCompiling,
    setIsCompiling,
    uniformsRef,
    updateUniform,
    
    // UI Uniforms
    uiUniforms,
    setUiUniforms,
    updateUiUniform,
    
    // UI State
    activeTab,
    setActiveTab,
    toast,
    setToast,
    showToast,
    stats,
    setStats,
    codeFormat,
    setCodeFormat,
    
    // Actions
    loadPreset,
    PRESETS
  };
  
  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
}

// Hook to use context
export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within StudioProvider');
  }
  return context;
}

export default StudioContext;
