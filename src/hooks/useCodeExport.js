import { useCallback } from 'react';
import {
  generateThreeJS,
  generateR3F,
  generateGLSLFiles,
  generateVanillaWebGL,
  downloadFile
} from '../lib/codeTemplates';

export function useCodeExport() {
  // Generate code for format
  const generateCode = useCallback((format, vertSrc, fragSrc, uniforms, presetCategory) => {
    // Build uniform values object
    const uniformValues = {
      u_time: 0,
      u_timeScale: uniforms.u_timeScale?.value || 1.0,
      u_warp: uniforms.u_warp?.value || 0.0,
      u_brightness: uniforms.u_brightness?.value || 1.0,
      u_steps: uniforms.u_steps?.value || 4.0,
      u_threshold: uniforms.u_threshold?.value || 0.5,
      u_freq: uniforms.u_freq?.value || 3.0,
      u_color1: '#' + uniforms.u_color1?.value.getHexString() || '4fffb0',
      u_color2: '#' + uniforms.u_color2?.value.getHexString() || '0a0020',
      u_color3: '#' + uniforms.u_color3?.value.getHexString() || 'ff6b6b'
    };
    
    switch (format) {
      case 'threejs':
        return generateThreeJS(vertSrc, fragSrc, uniformValues, presetCategory);
      case 'r3f':
        return generateR3F(vertSrc, fragSrc, uniformValues, presetCategory);
      case 'glsl':
        return generateGLSLFiles(vertSrc, fragSrc, uniformValues);
      case 'vanilla':
        return generateVanillaWebGL(vertSrc, fragSrc, uniformValues, presetCategory);
      default:
        return generateThreeJS(vertSrc, fragSrc, uniformValues, presetCategory);
    }
  }, []);
  
  // Download code
  const downloadCode = useCallback((format, vertSrc, fragSrc, uniforms, presetCategory) => {
    const timestamp = Date.now();
    
    switch (format) {
      case 'threejs': {
        const code = generateCode('threejs', vertSrc, fragSrc, uniforms, presetCategory);
        downloadFile(code, `shader-material-${timestamp}.js`, 'text/javascript');
        break;
      }
      case 'r3f': {
        const code = generateCode('r3f', vertSrc, fragSrc, uniforms, presetCategory);
        downloadFile(code, `shader-mesh-${timestamp}.jsx`, 'text/javascript');
        break;
      }
      case 'glsl': {
        const files = generateCode('glsl', vertSrc, fragSrc, uniforms, presetCategory);
        downloadFile(files.vertex, 'vertex.glsl', 'text/plain');
        setTimeout(() => downloadFile(files.fragment, 'fragment.glsl', 'text/plain'), 100);
        setTimeout(() => downloadFile(files.uniforms, 'uniforms.json', 'application/json'), 200);
        break;
      }
      case 'vanilla': {
        const code = generateCode('vanilla', vertSrc, fragSrc, uniforms, presetCategory);
        downloadFile(code, `shader-demo-${timestamp}.html`, 'text/html');
        break;
      }
    }
  }, [generateCode]);
  
  // Copy to clipboard
  const copyToClipboard = useCallback(async (format, vertSrc, fragSrc, uniforms, presetCategory) => {
    let code;
    
    if (format === 'glsl') {
      const files = generateCode('glsl', vertSrc, fragSrc, uniforms, presetCategory);
      code = `// Vertex Shader\n\n${files.vertex}\n\n// Fragment Shader\n\n${files.fragment}`;
    } else {
      code = generateCode(format, vertSrc, fragSrc, uniforms, presetCategory);
    }
    
    try {
      await navigator.clipboard.writeText(code);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }, [generateCode]);
  
  // Get format label
  const getFormatLabel = useCallback((format) => {
    switch (format) {
      case 'threejs': return 'Three.js';
      case 'r3f': return 'R3F';
      case 'glsl': return 'GLSL Files';
      case 'vanilla': return 'Vanilla WebGL';
      default: return format;
    }
  }, []);
  
  // Get format description
  const getFormatDescription = useCallback((format) => {
    switch (format) {
      case 'threejs':
        return 'Standard Three.js ShaderMaterial code. Drop this into any Three.js project.';
      case 'r3f':
        return 'React Three Fiber component with useFrame hook for animation.';
      case 'glsl':
        return 'Raw GLSL vertex and fragment shaders with uniforms JSON.';
      case 'vanilla':
        return 'Standalone HTML file with pure WebGL. No dependencies.';
      default:
        return '';
    }
  }, []);
  
  return {
    generateCode,
    downloadCode,
    copyToClipboard,
    getFormatLabel,
    getFormatDescription
  };
}

export default useCodeExport;
