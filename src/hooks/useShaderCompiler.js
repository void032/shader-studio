// useShaderCompiler.js - Custom React hook for compiling and managing shader materials in a Three.js scene
import { useCallback, useRef } from 'react';
import * as THREE from 'three';

export function useShaderCompiler() {
  const materialRef = useRef(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Shallow-clone uniforms for TESTING ONLY.
   * Copies the current value of each uniform so the test material is isolated.
   * Do NOT use this for the live material — it breaks animation because the
   * animation loop mutates the original uniform objects (e.g. u_time.value++),
   * and a clone won't see those mutations.
   */
  const cloneUniformsForTest = (uniforms) =>
    Object.fromEntries(
      Object.entries(uniforms).map(([key, uniform]) => [key, { value: uniform.value }])
    );

  /**
   * Detect whether the fragment shader uses any form of transparency.
   * Accepts uniform-driven alpha, computed variables, and `discard`.
   */
  const detectAlpha = (fragSrc) =>
    fragSrc.includes('discard') ||
    // gl_FragColor fourth component is anything other than a literal 1.0 / 1
    /gl_FragColor\s*=\s*vec4\s*\([^)]+\)/.test(fragSrc);

  // ─── buildShaderMaterial ────────────────────────────────────────────────────

  /**
   * Build (or rebuild) the shader material.
   * The previous material is disposed before creating the new one.
   * On failure the ref is left as-is and an error is thrown so callers can
   * decide how to handle it.
   *
   * @param {string}  vertSrc    - GLSL vertex shader source
   * @param {string}  fragSrc    - GLSL fragment shader source
   * @param {object}  uniforms   - THREE-style uniforms map  { name: { value } }
   * @param {boolean} [wireframe=false]
   * @param {boolean} [vertexColors=true]  - pass false to disable vertex colours
   * @returns {THREE.ShaderMaterial}
   */
  const buildShaderMaterial = useCallback(
    (vertSrc, fragSrc, uniforms, wireframe = false, vertexColors = true) => {
      let material;

      try {
        material = new THREE.ShaderMaterial({
          // Pass the LIVE uniforms object directly — do NOT clone here.
          // The animation loop mutates uniform values in-place (e.g. u_time.value += delta).
          // Cloning would snapshot the values at compile time and freeze all animation.
          uniforms,
          vertexShader: vertSrc,
          fragmentShader: fragSrc,
          vertexColors,
          transparent: detectAlpha(fragSrc),
          // side: THREE.FrontSide is already the default — omitted intentionally
          wireframe,
        });
      } catch (err) {
        throw new Error(`[useShaderCompiler] buildShaderMaterial failed: ${err.message}`);
      }

      // Dispose old material only after new one is confirmed to exist
      if (materialRef.current) {
        materialRef.current.dispose();
      }

      materialRef.current = material;
      return material;
    },
    []
  );

  // ─── testCompile ────────────────────────────────────────────────────────────

  /**
   * Attempt a real WebGL compile + render of the shader to catch errors before
   * applying them to the scene.
   *
   * @param {string}             vertSrc
   * @param {string}             fragSrc
   * @param {object}             uniforms
   * @param {THREE.WebGLRenderer} renderer
   * @returns {{ ok: boolean, error?: string }}
   */
  const testCompile = useCallback((vertSrc, fragSrc, uniforms, renderer) => {
    const testGeo = new THREE.PlaneGeometry(1, 1, 2, 2);
    let testMaterial;
    let testMesh;
    const testScene = new THREE.Scene();

    try {
      // Clone uniforms for the test render only — this isolates the test
      // material from the live animation loop (safe because it's throwaway)
      testMaterial = new THREE.ShaderMaterial({
        uniforms: cloneUniformsForTest(uniforms),
        vertexShader: vertSrc,
        fragmentShader: fragSrc,
        vertexColors: true,
      });

      // Satisfy vertexColors requirement
      const count = testGeo.attributes.position.count;
      testGeo.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(new Float32Array(count * 3).fill(0.5), 3)
      );

      testMesh = new THREE.Mesh(testGeo, testMaterial);
      testScene.add(testMesh);

      const testCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      testCamera.position.z = 2;

      renderer.render(testScene, testCamera);

      const gl = renderer.getContext();
      const glError = gl.getError();

      if (glError !== gl.NO_ERROR) {
        return { ok: false, error: `WebGL error 0x${glError.toString(16)}` };
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'Unknown compilation error' };
    } finally {
      // Always clean up — mesh, geometry, and material
      if (testMesh) {
        testScene.remove(testMesh);
        testMesh.geometry = null;
        testMesh.material = null;
      }
      testGeo.dispose();
      if (testMaterial) testMaterial.dispose();
    }
  }, []);

  // ─── applyToTarget ──────────────────────────────────────────────────────────

  /**
   * Apply a material to a render target.
   * For GLB scenes every mesh gets its own clone of the material.
   * For single meshes the material is applied directly (no clone needed).
   *
   * @param {{ type: string, mesh: THREE.Object3D }} target
   * @param {THREE.Material} material
   */
  const applyToTarget = useCallback((target, material) => {
    if (!target?.mesh) return;

    const { type, mesh } = target;

    if (type === 'terrain' || type === 'primitive') {
      const oldMat = mesh.material;
      mesh.material = material;
      if (oldMat && oldMat !== material) oldMat.dispose();
    } else if (type === 'glb') {
      mesh.traverse((child) => {
        if (!child.isMesh) return;
        const oldMat = child.material;
        // Clone the material so each mesh has independent render state (wireframe,
        // side, etc.), but reassign uniforms to point back at the SAME live object
        // so the animation loop's mutations (u_time, etc.) reach every mesh.
        const cloned = material.clone();
        cloned.uniforms = material.uniforms;
        child.material = cloned;
        if (oldMat) oldMat.dispose();
      });
    }
  }, []);

  // ─── resetToStandard ────────────────────────────────────────────────────────

  /**
   * Replace the current shader material with a sensible MeshStandardMaterial.
   *
   * @param {{ type: string, mesh: THREE.Object3D }} target
   * @param {boolean} [vertexColors=true]
   */
  const resetToStandard = useCallback((target, vertexColors = true) => {
    if (!target?.mesh) return;

    const { type, mesh } = target;

    // Template material — cloned per mesh for GLB, used directly otherwise
    const templateMat = new THREE.MeshStandardMaterial({
      vertexColors,
      roughness: 0.7,
      metalness: 0.1,
    });

    if (type === 'terrain' || type === 'primitive') {
      const oldMat = mesh.material;
      mesh.material = templateMat;
      if (oldMat && oldMat !== templateMat) oldMat.dispose();
    } else if (type === 'glb') {
      mesh.traverse((child) => {
        if (!child.isMesh) return;
        const oldMat = child.material;
        child.material = templateMat.clone();
        if (oldMat) oldMat.dispose();
      });
      // The template itself is no longer needed after cloning
      templateMat.dispose();
    }
  }, []);

  // ─── setUniform ─────────────────────────────────────────────────────────────

  /**
   * Update a single uniform on the active material without rebuilding it.
   * Silently no-ops if the material or uniform key doesn't exist.
   *
   * @param {string} key   - uniform name
   * @param {*}      value - new value
   */
  const setUniform = useCallback((key, value) => {
    const mat = materialRef.current;
    if (!mat) return;
    if (!(key in mat.uniforms)) {
      console.warn(`[useShaderCompiler] setUniform: unknown uniform "${key}"`);
      return;
    }
    mat.uniforms[key].value = value;
  }, []);

  // ─── Accessors & lifecycle ──────────────────────────────────────────────────

  /**
   * Returns the current material from the ref (always fresh, unlike the
   * `material` property that was previously exposed on the return object).
   */
  const getMaterial = useCallback(() => materialRef.current, []);

  const dispose = useCallback(() => {
    if (materialRef.current) {
      materialRef.current.dispose();
      materialRef.current = null;
    }
  }, []);

  return {
    buildShaderMaterial,
    testCompile,
    applyToTarget,
    resetToStandard,
    setUniform,
    getMaterial,
    dispose,
    // NOTE: `material` is intentionally NOT exposed here.
    // materialRef.current is captured at render time and would always be stale.
    // Use getMaterial() to retrieve the current material instance.
  };
}

export default useShaderCompiler;