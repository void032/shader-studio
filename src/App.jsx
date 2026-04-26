//App.jsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import './styles/globals.css';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

// Context
import { StudioProvider, useStudio, TARGET_TYPES, PRIMITIVE_SHAPES, getPresetById } from './context/StudioContext';

// Hooks
import { useThreeScene } from './hooks/useThreeScene';
import { useTerrain } from './hooks/useTerrain';
import { useGLBLoader } from './hooks/useGLBLoader';
import { useShaderCompiler } from './hooks/useShaderCompiler';

// Components
import { Sidebar } from './components/Sidebar';
import { WelcomeModal } from './components/ui/WelcomeModal';
import { Toast } from './components/ui/Toast';

// Primitive geometry creators
function createPrimitiveGeometry(config) {
  switch (config.shape) {
    case PRIMITIVE_SHAPES.BOX:
      return new THREE.BoxGeometry(
        config.width,
        config.height,
        config.depth,
        4, 4, 4
      );
    case PRIMITIVE_SHAPES.SPHERE:
      return new THREE.SphereGeometry(
        config.radius,
        config.widthSegments,
        config.heightSegments
      );
    case PRIMITIVE_SHAPES.TORUS:
      return new THREE.TorusGeometry(
        config.radius,
        config.tube,
        config.radialSegments,
        config.tubularSegments
      );
    case PRIMITIVE_SHAPES.TORUS_KNOT:
      return new THREE.TorusKnotGeometry(
        config.radius,
        config.tube,
        config.tubularSegments,
        config.radialSegments,
        config.p,
        config.q
      );
    case PRIMITIVE_SHAPES.CYLINDER:
      return new THREE.CylinderGeometry(
        config.radius,
        config.radius,
        config.height,
        config.radialSegments
      );
    case PRIMITIVE_SHAPES.CONE:
      return new THREE.ConeGeometry(
        config.radius,
        config.height,
        config.radialSegments
      );
    default:
      return new THREE.SphereGeometry(3, 32, 32);
  }
}

// Add vertex colors to geometry
function addVertexColors(geometry) {
  const positions = geometry.attributes.position.array;
  const count = positions.length / 3;
  const colors = new Float32Array(count * 3);
  
  // Find Y range
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    const y = positions[i * 3 + 1];
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  
  const yRange = maxY - minY || 1;
  
  // Generate gradient colors (gray to white based on Y)
  for (let i = 0; i < count; i++) {
    const y = positions[i * 3 + 1];
    const t = (y - minY) / yRange;
    const gray = 0.3 + t * 0.7; // 0.3 to 1.0
    colors[i * 3] = gray;
    colors[i * 3 + 1] = gray;
    colors[i * 3 + 2] = gray;
  }
  
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

// Main App Component
function AppContent() {
  // Refs
  const canvasContainerRef = useRef(null);
  const primitiveMeshRef = useRef(null);
  
  // Context
  const {
    activeTarget,
    setActiveTarget,
    terrainConfig,
    setTerrainConfig,
    primitiveConfig,
    setPrimitiveConfig,
    glbData,
    setGlbData,
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
    uiUniforms,
    setUiUniforms,
    updateUiUniform,
    activeTab,
    setActiveTab,
    toast,
    setStats,
    showToast,
    loadPreset,
    PRESETS
  } = useStudio();
  
  // Hooks
  const { scene, renderer, camera, setGridVisible, getDelta } = useThreeScene(canvasContainerRef);
  const { createTerrainMesh, getTerrainMesh, disposeTerrain, setWireframe } = useTerrain();
  const { loadGLB, getScene: getGLBScene, dispose: disposeGLB, applyMaterial } = useGLBLoader();
  const { buildShaderMaterial, testCompile, applyToTarget, resetToStandard } = useShaderCompiler();
  
  // Initialize terrain on mount
  useEffect(() => {
    if (!scene) return;
    
    // Create initial terrain
    const { mesh, vertCount, triCount } = createTerrainMesh(terrainConfig);
    scene.add(mesh);
    
    setActiveTarget({
      type: TARGET_TYPES.TERRAIN,
      mesh,
      name: 'Terrain',
      vertCount,
      triCount
    });
    
    setStats({ verts: vertCount, tris: triCount });
    setGridVisible(false);
    
    return () => {
      disposeTerrain();
    };
  }, [scene]);
  
  // Update terrain when config changes (debounced)
  useEffect(() => {
    if (!scene || activeTarget.type !== TARGET_TYPES.TERRAIN) return;
    
    const timeout = setTimeout(() => {
      // Remove old terrain
      const oldMesh = getTerrainMesh();
      if (oldMesh) {
        scene.remove(oldMesh);
      }
      
      // Create new terrain
      const { mesh, vertCount, triCount } = createTerrainMesh(terrainConfig);
      scene.add(mesh);
      
      // Apply custom shader if active
      if (usingCustomShader) {
        const material = buildShaderMaterial(vertSrc, fragSrc, uniformsRef.current, terrainConfig.wireframe);
        mesh.material = material;
      }
      
      setActiveTarget({
        type: TARGET_TYPES.TERRAIN,
        mesh,
        name: 'Terrain',
        vertCount,
        triCount
      });
      
      setStats({ verts: vertCount, tris: triCount });
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [terrainConfig, scene]);
  
  // Update wireframe
  useEffect(() => {
    setWireframe(terrainConfig.wireframe);
  }, [terrainConfig.wireframe]);
  
  // Animation loop for uniforms
  useEffect(() => {
    if (!renderer) return;
    
    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      
      // Update time uniform
      const delta = getDelta();
      uniformsRef.current.u_time.value += delta * uniformsRef.current.u_timeScale.value;
    };
    
    animate();
    
    return () => cancelAnimationFrame(rafId);
  }, [renderer]);
  
  // Terrain handlers
  const handleTerrainChange = useCallback((newConfig) => {
    setTerrainConfig(newConfig);
  }, [setTerrainConfig]);
  
  const handleTerrainRegenerate = useCallback(() => {
    setTerrainConfig({ ...terrainConfig, seed: Math.floor(Math.random() * 65536) });
  }, [terrainConfig, setTerrainConfig]);
  
  const handleSetTerrainActive = useCallback(() => {
    if (!scene) return;
    
    // Remove current target
    if (activeTarget.mesh) {
      if (activeTarget.type === TARGET_TYPES.GLB) {
        scene.remove(activeTarget.mesh);
      } else if (activeTarget.type === TARGET_TYPES.PRIMITIVE && primitiveMeshRef.current) {
        scene.remove(primitiveMeshRef.current);
      }
    }
    
    // Get or create terrain
    let mesh = getTerrainMesh();
    if (!mesh) {
      const result = createTerrainMesh(terrainConfig);
      mesh = result.mesh;
      scene.add(mesh);
    } else {
      scene.add(mesh);
    }
    
    // Apply custom shader if active
    if (usingCustomShader) {
      const material = buildShaderMaterial(vertSrc, fragSrc, uniformsRef.current, terrainConfig.wireframe);
      mesh.material = material;
    }
    
    const vertCount = mesh.geometry.attributes.position.count;
    const triCount = mesh.geometry.index ? mesh.geometry.index.count / 3 : vertCount / 3;
    
    setActiveTarget({
      type: TARGET_TYPES.TERRAIN,
      mesh,
      name: 'Terrain',
      vertCount,
      triCount
    });
    
    setStats({ verts: vertCount, tris: triCount });
    setGridVisible(false);
    showToast('Terrain set as active target');
  }, [scene, activeTarget, terrainConfig, usingCustomShader, vertSrc, fragSrc, uniformsRef, buildShaderMaterial, createTerrainMesh, getTerrainMesh, setActiveTarget, setStats, setGridVisible, showToast]);
  
  // GLB handlers
  const handleGLBLoad = useCallback(async (file) => {
    if (!scene) return;
    
    try {
      // Remove current target
      if (activeTarget.mesh) {
        scene.remove(activeTarget.mesh);
      }
      if (primitiveMeshRef.current) {
        scene.remove(primitiveMeshRef.current);
      }
      
      // Dispose old GLB
      disposeGLB();
      
      // Load new GLB
      const data = await loadGLB(file);
      setGlbData(data);
      
      scene.add(data.scene);
      
      // Apply custom shader if active
      if (usingCustomShader) {
        const material = buildShaderMaterial(vertSrc, fragSrc, uniformsRef.current);
        applyMaterial(material);
      }
      
      setActiveTarget({
        type: TARGET_TYPES.GLB,
        mesh: data.scene,
        name: data.name,
        vertCount: data.vertCount,
        triCount: data.triCount
      });
      
      setStats({ verts: data.vertCount, tris: data.triCount });
      setGridVisible(true);
      showToast(`Loaded ${data.name}`);
    } catch (error) {
      console.error('Failed to load GLB:', error);
      showToast('Failed to load GLB file', 'error');
    }
  }, [scene, activeTarget, usingCustomShader, vertSrc, fragSrc, uniformsRef, buildShaderMaterial, applyMaterial, disposeGLB, loadGLB, setGlbData, setActiveTarget, setStats, setGridVisible, showToast]);
  
  const handleGLBClear = useCallback(() => {
    if (!scene) return;
    
    if (activeTarget.type === TARGET_TYPES.GLB && activeTarget.mesh) {
      scene.remove(activeTarget.mesh);
    }
    
    disposeGLB();
    setGlbData(null);
    
    // Switch back to terrain
    const mesh = getTerrainMesh();
    if (mesh) {
      scene.add(mesh);
      
      const vertCount = mesh.geometry.attributes.position.count;
      const triCount = mesh.geometry.index ? mesh.geometry.index.count / 3 : vertCount / 3;
      
      setActiveTarget({
        type: TARGET_TYPES.TERRAIN,
        mesh,
        name: 'Terrain',
        vertCount,
        triCount
      });
      
      setStats({ verts: vertCount, tris: triCount });
      setGridVisible(false);
    }
    
    showToast('GLB cleared');
  }, [scene, activeTarget, disposeGLB, setGlbData, getTerrainMesh, setActiveTarget, setStats, setGridVisible, showToast]);
  
  // Primitive handlers
  const handlePrimitiveChange = useCallback((newConfig) => {
    setPrimitiveConfig(newConfig);
  }, [setPrimitiveConfig]);
  
  const handleSetPrimitiveActive = useCallback(() => {
    if (!scene) return;
    
    // Remove current target
    if (activeTarget.mesh) {
      scene.remove(activeTarget.mesh);
    }
    if (primitiveMeshRef.current) {
      scene.remove(primitiveMeshRef.current);
    }
    
    // Create primitive geometry
    const geometry = createPrimitiveGeometry(primitiveConfig);
    addVertexColors(geometry);
    geometry.computeVertexNormals();
    
    // Create material
    const material = usingCustomShader
      ? buildShaderMaterial(vertSrc, fragSrc, uniformsRef.current)
      : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.1 });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = primitiveConfig.shape;
    
    scene.add(mesh);
    primitiveMeshRef.current = mesh;
    
    const vertCount = geometry.attributes.position.count;
    const triCount = geometry.index ? geometry.index.count / 3 : vertCount / 3;
    
    setActiveTarget({
      type: TARGET_TYPES.PRIMITIVE,
      mesh,
      name: primitiveConfig.shape,
      vertCount,
      triCount
    });
    
    setStats({ verts: vertCount, tris: triCount });
    setGridVisible(true);
    showToast(`${primitiveConfig.shape} set as active target`);
  }, [scene, activeTarget, primitiveConfig, usingCustomShader, vertSrc, fragSrc, uniformsRef, buildShaderMaterial, setActiveTarget, setStats, setGridVisible, showToast]);
  
  // Shader handlers
  const handlePresetSelect = useCallback((presetId) => {
    loadPreset(presetId);
    
    // Show preset-specific tips
    if (presetId === 'hologram') {
      showToast('Hologram uses alpha — looks best on dark backgrounds');
    } else if (presetId === 'dissolve') {
      showToast('Use u_threshold slider to control dissolve amount');
    }
  }, [loadPreset, showToast]);
  
  const handleVertChange = useCallback((value) => {
    setVertSrc(value);
  }, [setVertSrc]);
  
  const handleFragChange = useCallback((value) => {
    setFragSrc(value);
  }, [setFragSrc]);
  
  const handleCompile = useCallback(async () => {
    if (!renderer) return;
    
    setIsCompiling(true);
    setShaderError(null);
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = await testCompile(vertSrc, fragSrc, uniformsRef.current, renderer);
    
    if (result.ok) {
      setUsingCustomShader(true);
      
      // Build and apply material
      const material = buildShaderMaterial(
        vertSrc,
        fragSrc,
        uniformsRef.current,
        activeTarget.type === TARGET_TYPES.TERRAIN ? terrainConfig.wireframe : false
      );
      
      applyToTarget(activeTarget, material);
      
      showToast('Shader compiled and applied');
    } else {
      setShaderError(result.error);
      showToast('Shader compilation failed', 'error');
    }
    
    setIsCompiling(false);
  }, [renderer, vertSrc, fragSrc, uniformsRef, activeTarget, terrainConfig.wireframe, buildShaderMaterial, applyToTarget, testCompile, setUsingCustomShader, setShaderError, setIsCompiling, showToast]);
  
  const handleResetShader = useCallback(() => {
    setUsingCustomShader(false);
    setShaderError(null);
    resetToStandard(activeTarget);
    showToast('Reset to standard material');
  }, [activeTarget, resetToStandard, setUsingCustomShader, setShaderError, showToast]);
  
  const handleUniformChange = useCallback((name, value) => {
    updateUiUniform(name, value);
  }, [updateUiUniform]);
  
  // Navigation handler
  const handleNavigateToCode = useCallback(() => {
    setActiveTab('code');
  }, [setActiveTab]);
  
  // Get preset category
  const preset = getPresetById(activePresetId);
  const presetCategory = preset?.category || 'surface';
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Sidebar */}
      <Sidebar
        terrainConfig={terrainConfig}
        onTerrainChange={handleTerrainChange}
        onTerrainRegenerate={handleTerrainRegenerate}
        primitiveConfig={primitiveConfig}
        onPrimitiveChange={handlePrimitiveChange}
        glbData={glbData}
        onGLBLoad={handleGLBLoad}
        onGLBClear={handleGLBClear}
        onSetTerrainActive={handleSetTerrainActive}
        onSetPrimitiveActive={handleSetPrimitiveActive}
        onSetGLBActive={() => {}} // GLB is auto-active on load
        onPresetSelect={handlePresetSelect}
        onVertChange={handleVertChange}
        onFragChange={handleFragChange}
        onCompile={handleCompile}
        onResetShader={handleResetShader}
        onUniformChange={handleUniformChange}
        onNavigateToCode={handleNavigateToCode}
      />
      
      {/* Canvas Container */}
      <div ref={canvasContainerRef} className="canvas-container" />
      
      {/* Stats */}
      <div className="stats">
        <div className="stat-item">
          <span>Vertices:</span>
          <span className="stat-value">{activeTarget.vertCount?.toLocaleString() || 0}</span>
        </div>
        <div className="stat-item">
          <span>Triangles:</span>
          <span className="stat-value">{activeTarget.triCount?.toLocaleString() || 0}</span>
        </div>
        <div className="stat-item">
          <span>Target:</span>
          <span className="stat-value">{activeTarget.name || 'None'}</span>
        </div>
      </div>
      
      {/* Toast */}
      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}

// App with Provider
function App() {
  
  return (<>
    <StudioProvider>
      <WelcomeModal/>
      <AppContent />
    </StudioProvider>
    <SpeedInsights />
    <Analytics />
    </>
  );
}

export default App;
