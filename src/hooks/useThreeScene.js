import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

export function useThreeScene(containerRef) {
  // Refs for Three.js objects
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const rafRef = useRef(null);
  const gridRef = useRef(null);
  
  // Orbit controls state
  const orbitState = useRef({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: 40,
    target: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
    autoRotate: true
  });
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.008);
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();
    
    // Lights
    setupLights(scene);
    
    // Grid
    const grid = new THREE.GridHelper(200, 40, 0x222222, 0x1a1a1a);
    grid.position.y = -10;
    scene.add(grid);
    gridRef.current = grid;
    
    // Event listeners
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    
    const handleMouseDown = (e) => {
      orbitState.current.isDragging = true;
      orbitState.current.lastMouse = { x: e.clientX, y: e.clientY };
      orbitState.current.autoRotate = false;
    };
    
    const handleMouseMove = (e) => {
      if (!orbitState.current.isDragging) return;
      
      const deltaX = e.clientX - orbitState.current.lastMouse.x;
      const deltaY = e.clientY - orbitState.current.lastMouse.y;
      
      orbitState.current.theta -= deltaX * 0.01;
      orbitState.current.phi -= deltaY * 0.01;
      orbitState.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitState.current.phi));
      
      orbitState.current.lastMouse = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };
    
    const handleMouseUp = () => {
      orbitState.current.isDragging = false;
    };
    
    const handleWheel = (e) => {
      e.preventDefault();
      orbitState.current.radius += e.deltaY * 0.05;
      orbitState.current.radius = Math.max(5, Math.min(500, orbitState.current.radius));
      orbitState.current.autoRotate = false;
      updateCameraPosition();
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        resetCamera();
      }
    };
    
    // Touch support
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        orbitState.current.isDragging = true;
        orbitState.current.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        orbitState.current.autoRotate = false;
      }
    };
    
    const handleTouchMove = (e) => {
      if (!orbitState.current.isDragging || e.touches.length !== 1) return;
      
      const deltaX = e.touches[0].clientX - orbitState.current.lastMouse.x;
      const deltaY = e.touches[0].clientY - orbitState.current.lastMouse.y;
      
      orbitState.current.theta -= deltaX * 0.01;
      orbitState.current.phi -= deltaY * 0.01;
      orbitState.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitState.current.phi));
      
      orbitState.current.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateCameraPosition();
    };
    
    const handleTouchEnd = () => {
      orbitState.current.isDragging = false;
    };
    
    // Add listeners
    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    renderer.domElement.addEventListener('touchend', handleTouchEnd);
    
    // Animation loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      
      // Auto-rotate
      if (orbitState.current.autoRotate) {
        orbitState.current.theta += 0.002;
        updateCameraPosition();
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);
  
  // Update camera position based on orbit state
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    
    const { theta, phi, radius, target } = orbitState.current;
    
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  }, []);
  
  // Setup lights
  const setupLights = useCallback((scene) => {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    
    // Sun (directional)
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.6);
    sun.position.set(40, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);
    
    // Fill light
    const fill = new THREE.DirectionalLight(0x4060ff, 0.35);
    fill.position.set(-40, 20, -30);
    scene.add(fill);
    
    // Hemisphere for ambient fill
    const hemi = new THREE.HemisphereLight(0x1a2040, 0x0a0c10, 0.5);
    scene.add(hemi);
  }, []);
  
  // Reset camera
  const resetCamera = useCallback(() => {
    orbitState.current.theta = Math.PI / 4;
    orbitState.current.phi = Math.PI / 3;
    orbitState.current.radius = 40;
    orbitState.current.target.set(0, 0, 0);
    orbitState.current.autoRotate = true;
    updateCameraPosition();
  }, [updateCameraPosition]);
  
  // Show/hide grid
  const setGridVisible = useCallback((visible) => {
    if (gridRef.current) {
      gridRef.current.visible = visible;
    }
  }, []);
  
  // Get elapsed time
  const getElapsedTime = useCallback(() => {
    return clockRef.current.getElapsedTime();
  }, []);
  
  // Get delta time
  const getDelta = useCallback(() => {
    return clockRef.current.getDelta();
  }, []);
  
  return {
    renderer: rendererRef.current,
    scene: sceneRef.current,
    camera: cameraRef.current,
    clock: clockRef.current,
    resetCamera,
    setGridVisible,
    getElapsedTime,
    getDelta,
    orbitState
  };
}

export default useThreeScene;
