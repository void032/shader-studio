import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Support both old and new Three.js versions
const mergeGeometries =
  BufferGeometryUtils.mergeGeometries ??
  BufferGeometryUtils.mergeBufferGeometries;

export function useGLBLoader() {
  const glbSceneRef = useRef(null);
  const meshesRef = useRef([]);

  // ─── loadGLB ──────────────────────────────────────────────────────────────

  const loadGLB = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const loader = new GLTFLoader();

      loader.load(
        url,
        (gltf) => {
          URL.revokeObjectURL(url);

          // Bake all world matrices before we do any geometry work
          gltf.scene.updateMatrixWorld(true);

          const meshes = [];

          // Snapshot the tree BEFORE we mutate it (add/remove while traversing = bugs)
          const toProcess = [];
          gltf.scene.traverse((child) => {
            if (child.isMesh || child.isInstancedMesh) {
              toProcess.push(child);
            }
          });

          toProcess.forEach((child) => {

            // ── INSTANCED MESH → flatten every instance into real geometry ──
            if (child.isInstancedMesh) {
              const bladeGeos = [];
              const instanceMatrix = new THREE.Matrix4();

              for (let i = 0; i < child.count; i++) {
                child.getMatrixAt(i, instanceMatrix);

                const geo = child.geometry.clone();

                // Combine: instance-local transform  +  node's world transform
                // Without this, blades ignore the InstancedMesh's own position/rotation/scale
                const worldMatrix = child.matrixWorld.clone().multiply(instanceMatrix);
                geo.applyMatrix4(worldMatrix);

                bladeGeos.push(geo);
              }

              if (bladeGeos.length > 0) {
                const mergedGeo = mergeGeometries(bladeGeos, false);

                // Dispose the temporary per-blade clones immediately
                bladeGeos.forEach((g) => g.dispose());

                if (mergedGeo) {
                  const mergedMesh = new THREE.Mesh(mergedGeo, child.material);
                  meshes.push(mergedMesh);

                  // Swap in scene: add merged, remove instanced
                  if (child.parent) {
                    child.parent.add(mergedMesh);
                    child.parent.remove(child);
                  }
                }
              }

            // ── REGULAR MESH → strip skinning + morph data ────────────────
            } else if (child.isMesh) {

              // Remove bone/skinning data
              if (child.geometry.attributes.skinIndex) {
                child.geometry.deleteAttribute('skinIndex');
                child.geometry.deleteAttribute('skinWeight');
              }

              // Remove morph target attributes (name-based)
              Object.keys(child.geometry.attributes).forEach((name) => {
                if (name.startsWith('morphTarget') || name.startsWith('morphNormal')) {
                  child.geometry.deleteAttribute(name);
                }
              });

              // Remove the morphAttributes map and influences on the mesh itself
              if (child.geometry.morphAttributes) {
                child.geometry.morphAttributes = {};
              }
              child.morphTargetInfluences = null;
              child.morphTargetDictionary = null;

              meshes.push(child);
            }
          });

          // ── ADD VERTEX COLORS (required by custom shaders) ────────────────
          meshes.forEach((mesh) => {
            if (!mesh.geometry.attributes.color) {
              const count = mesh.geometry.attributes.position.count;
              const colors = new Float32Array(count * 3).fill(0.5);
              mesh.geometry.setAttribute(
                'color',
                new THREE.Float32BufferAttribute(colors, 3)
              );
            }
          });

          // ── STATS ─────────────────────────────────────────────────────────
          const vertCount = meshes.reduce(
            (sum, m) => sum + m.geometry.attributes.position.count,
            0
          );
          const triCount = meshes.reduce((sum, m) => {
            return sum + (m.geometry.index
              ? m.geometry.index.count / 3
              : m.geometry.attributes.position.count / 3);
          }, 0);

          // ── AUTO-CENTER + SCALE ───────────────────────────────────────────
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = maxDim > 0 ? 20 / maxDim : 1;

          gltf.scene.position.sub(center);
          gltf.scene.scale.setScalar(scale);

          // ── STORE REFS ────────────────────────────────────────────────────
          glbSceneRef.current = gltf.scene;
          meshesRef.current = meshes;

          resolve({ scene: gltf.scene, meshes, name: file.name, vertCount, triCount });
        },
        undefined,
        (error) => {
          URL.revokeObjectURL(url);
          reject(error);
        }
      );
    });
  }, []);

  // ─── applyMaterial ────────────────────────────────────────────────────────
  // Clone per mesh for independent render state, but share the live uniforms
  // object so animation (u_time, etc.) reaches every mesh every frame.

  const applyMaterial = useCallback((material) => {
    meshesRef.current.forEach((mesh) => {
      const old = mesh.material;
      const cloned = material.clone();

      // If it's a ShaderMaterial, share the live uniforms reference so
      // animation-loop mutations (u_time.value += delta) are visible on GPU
      if (material.isShaderMaterial) {
        cloned.uniforms = material.uniforms;
      }

      mesh.material = cloned;
      if (old) old.dispose();
    });
  }, []);

  // ─── resetMaterials ───────────────────────────────────────────────────────

  const resetMaterials = useCallback(() => {
    meshesRef.current.forEach((mesh) => {
      const old = mesh.material;
      mesh.material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.7,
        metalness: 0.1,
      });
      if (old) old.dispose(); // was leaking before
    });
  }, []);

  // ─── getMergedGeometry ────────────────────────────────────────────────────

  const getMergedGeometry = useCallback(() => {
    if (meshesRef.current.length === 0) return null;
    if (meshesRef.current.length === 1) return meshesRef.current[0].geometry.clone();

    try {
      const geometries = meshesRef.current.map((m) => {
        const geo = m.geometry.clone();
        m.updateMatrixWorld(true);
        geo.applyMatrix4(m.matrixWorld);
        return geo;
      });

      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose()); // clean up temp clones
      return merged;
    } catch (e) {
      console.warn('getMergedGeometry: merge failed, falling back to first mesh', e);
      return meshesRef.current[0].geometry.clone();
    }
  }, []);

  // ─── Accessors ────────────────────────────────────────────────────────────
  // NOTE: glbScene / meshes are NOT exposed as plain values on the return object.
  // useRef values captured at render time are always stale. Use getScene() / getMeshes().

  const getScene   = useCallback(() => glbSceneRef.current, []);
  const getMeshes  = useCallback(() => meshesRef.current,   []);

  // ─── dispose ──────────────────────────────────────────────────────────────

  const dispose = useCallback(() => {
    if (!glbSceneRef.current) return;

    glbSceneRef.current.traverse((child) => {
      if (child.isMesh || child.isInstancedMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    glbSceneRef.current = null;
    meshesRef.current = [];
  }, []);

  return {
    loadGLB,
    applyMaterial,
    resetMaterials,
    getMergedGeometry,
    getScene,
    getMeshes,
    dispose,
    // glbScene and meshes intentionally removed — always stale at render time.
    // Use getScene() and getMeshes() instead.
  };
}

export default useGLBLoader;