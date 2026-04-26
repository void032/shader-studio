// shaderPresets.js - Contains shader preset definitions and utility functions for retrieval

export const PRESETS = [
  // ==========================================
  //         SURFACE / MATERIAL (7)
  // ==========================================
  
  {
    id: 'height_gradient',
    label: 'Height Gradient',
    tag: 'surface',
    category: 'surface',
    description: 'Height-based vertex color with diffuse lighting. Uses vColor attribute and u_brightness uniform.',
    vert: `varying vec3 vColor;
varying vec3 vNormal;

void main() {
  vColor = color;
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    frag: `uniform float u_brightness;

varying vec3 vColor;
varying vec3 vNormal;

void main() {
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.7 + 0.3;
  gl_FragColor = vec4(vColor * diff * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'normals',
    label: 'Normal Visualizer',
    tag: 'debug',
    category: 'surface',
    description: 'World normal visualizer for debugging. Displays surface normals as RGB colors.',
    vert: `varying vec3 vNormal;

void main() {
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    frag: `uniform float u_brightness;

varying vec3 vNormal;

void main() {
  gl_FragColor = vec4(normalize(vNormal) * 0.5 + 0.5 * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'toon',
    label: 'Toon Shading',
    tag: 'stylized',
    category: 'surface',
    description: 'Cel/toon shading with quantized light bands. Uses u_steps for band count and u_color1/u_color2 for gradient.',
    vert: `varying vec3 vNormal;
varying vec3 vColor;

void main() {
  vNormal = normalMatrix * normal;
  vColor = color;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    frag: `uniform float u_steps;
uniform float u_brightness;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vNormal;
varying vec3 vColor;

void main() {
  float diff = max(dot(normalize(vNormal), normalize(vec3(1.0, 2.0, 0.8))), 0.0);
  float toon = floor(diff * u_steps) / u_steps;
  float lum = dot(vColor, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(u_color2, u_color1, lum) * (toon * 0.7 + 0.3) * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_steps: 4,
      u_brightness: 1.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'pbr_manual',
    label: 'Manual PBR',
    tag: 'advanced',
    category: 'surface',
    description: 'Manual GGX specular + diffuse PBR implementation. Uses roughness derived from vertex luminance.',
    vert: `varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vColor;

void main() {
  vNormal = normalMatrix * normal;
  vColor = color;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_brightness;
uniform float u_warp;
uniform vec3 u_color1;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vColor;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(vec3(40.0, 80.0, 30.0) - vWorldPos);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 H = normalize(L + V);
  
  float lum = dot(vColor, vec3(0.299, 0.587, 0.114));
  float roughness = clamp(0.3 + (1.0 - lum) * 0.5 + u_warp * 0.1, 0.04, 1.0);
  float metalness = lum * 0.4;
  
  float NdL = max(dot(N, L), 0.0);
  vec3 diffuse = vColor * NdL * (1.0 - metalness);
  
  float NdH = max(dot(N, H), 0.0);
  float a2 = roughness * roughness * roughness * roughness;
  float denom = NdH * NdH * (a2 - 1.0) + 1.0;
  float D = a2 / (3.14159 * denom * denom);
  
  vec3 F0 = mix(vec3(0.04), vColor, metalness);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);
  
  vec3 col = (diffuse + D * F * 1.5 + vColor * 0.08 + u_color1 * 0.04) * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 0.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'velvet',
    label: 'Velvet Cloth',
    tag: 'surface',
    category: 'surface',
    description: 'Soft fabric material using inverse Fresnel for edge fuzz lighting.',
    vert: `varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_brightness;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(vec3(10.0, 20.0, 10.0) - vWorldPos);
  
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  
  // Inverse fresnel for edge fuzz
  float rim = smoothstep(0.0, 1.0, 1.0 - NdotV);
  rim = pow(rim, 1.5);
  
  vec3 base = u_color2 * (NdotL * 0.6 + 0.4);
  vec3 fuzz = u_color1 * rim;
  
  gl_FragColor = vec4((base + fuzz) * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_color1: '#ff6b6b',
      u_color2: '#4a0010',
      u_color3: '#0a0020'
    }
  },
  {
    id: 'tron_grid',
    label: 'Tron Grid',
    tag: 'surface',
    category: 'surface',
    description: 'Procedural glowing neon grid lines mapped onto the geometry world coordinates.',
    vert: `varying vec3 vWorldPos;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_brightness;
uniform float u_freq;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vWorldPos;

void main() {
  vec2 grid = fract(vWorldPos.xz * (u_freq * 0.5));
  float thickness = 0.05;
  
  float lineX = smoothstep(1.0 - thickness, 1.0, grid.x) + smoothstep(thickness, 0.0, grid.x);
  float lineZ = smoothstep(1.0 - thickness, 1.0, grid.y) + smoothstep(thickness, 0.0, grid.y);
  float glow = clamp(lineX + lineZ, 0.0, 1.0);
  
  vec3 col = mix(u_color2, u_color1, glow);
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.2,
      u_freq: 3.0,
      u_color1: '#4fffb0',
      u_color2: '#050510',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'procedural_marble',
    label: 'Procedural Marble',
    tag: 'surface',
    category: 'surface',
    description: 'Procedural 3D noise used to create a marble or vein-like structure.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_brightness;
uniform float u_freq;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vWorldPos;
varying vec3 vNormal;

// Simple 3D hash
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// Simple 3D noise
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

void main() {
  vec3 p = vWorldPos * u_freq * 0.5;
  float n = noise(p + 5.0 * noise(p * 2.0));
  
  // Create veins using sine and noise
  float marble = abs(sin(p.x + n * 4.0));
  marble = smoothstep(0.0, 0.8, marble);
  
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.8 + 0.2;
  
  vec3 col = mix(u_color2, u_color1, marble);
  gl_FragColor = vec4(col * diff * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_freq: 2.0,
      u_color1: '#ffffff',
      u_color2: '#2b2b3a',
      u_color3: '#000000'
    }
  },

  // ==========================================
  //          STYLIZED / FX (7)
  // ==========================================
  {
    id: 'thermal',
    label: 'Thermal Camera',
    tag: 'scifi',
    category: 'fx',
    description: 'Thermal camera color ramp (black→purple→red→yellow→white). Uses vHeight for temperature mapping.',
    vert: `varying float vHeight;

void main() {
  vHeight = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    frag: `uniform float u_brightness;
uniform float u_time;
uniform float u_warp;

varying float vHeight;

vec3 thermalRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  if(t < 0.2) return mix(vec3(0.0), vec3(0.5, 0.0, 0.5), t / 0.2);
  if(t < 0.4) return mix(vec3(0.5, 0.0, 0.5), vec3(1.0, 0.0, 0.0), (t - 0.2) / 0.2);
  if(t < 0.6) return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.4) / 0.2);
  if(t < 0.8) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.6) / 0.2);
  return mix(vec3(1.0, 1.0, 0.0), vec3(1.0), (t - 0.8) / 0.2);
}

void main() {
  float h = vHeight * 0.05 + 0.5 + sin(vHeight * u_warp + u_time) * 0.02;
  vec3 col = thermalRamp(h) * u_brightness;
  col.r += sin(gl_FragCoord.y * 3.0 + u_time * 4.0) * 0.015;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 0.5,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'hologram',
    label: 'Hologram Scanlines',
    tag: 'scifi',
    category: 'fx',
    description: 'Fresnel rim glow with animated scanlines and flicker. Uses u_color1, u_time, and alpha transparency.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_warp;
uniform vec3 u_color1;

varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  float scan = smoothstep(0.3, 0.7, sin(vWorldPos.y * 12.0 + u_time * 3.0) * 0.5 + 0.5);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.0);
  float flicker = 0.92 + sin(u_time * 17.3) * 0.04 + sin(u_time * 5.1) * 0.04;
  
  vec3 col = u_color1 * (scan * 0.6 + fresnel * 0.8 + 0.15) * flicker * u_brightness;
  col.g += u_warp * 0.1 * sin(vWorldPos.x * 2.0 + u_time);
  
  float alpha = clamp((scan * 0.5 + fresnel * 0.6 + 0.1) * flicker, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}`,
    defaultUniforms: {
      u_brightness: 1.2,
      u_warp: 0.5,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'xray',
    label: 'X-Ray Rim',
    tag: 'scifi',
    category: 'fx',
    description: 'Fresnel-only rim glow with inner darkness and bright edges. Uses alpha for transparency.',
    vert: `varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_brightness;
uniform float u_warp;
uniform vec3 u_color1;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rim = 1.0 - abs(dot(normalize(vNormal), viewDir));
  rim = pow(rim, 2.0 + u_warp);
  vec3 col = u_color1 * rim * u_brightness;
  gl_FragColor = vec4(col, rim * 0.85);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 0.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'iridescent',
    label: 'Iridescent',
    tag: 'fx',
    category: 'fx',
    description: 'View-angle rainbow shift via dot(normal, viewDir). Creates oil-slick or soap bubble effect.',
    vert: `varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vColor;

void main() {
  vNormal = normalMatrix * normal;
  vColor = color;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_brightness;
uniform float u_warp;
uniform float u_time;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vColor;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float NdV = dot(normalize(vNormal), viewDir);
  float angle = acos(clamp(NdV, -1.0, 1.0)) / 3.14159;
  
  float hue = angle + u_time * 0.05 * u_warp;
  float r = abs(sin(hue * 3.14159 * 2.0));
  float g = abs(sin(hue * 3.14159 * 2.0 + 2.094));
  float b = abs(sin(hue * 3.14159 * 2.0 + 4.189));
  vec3 iris = vec3(r, g, b);
  
  vec3 col = mix(vColor, iris, 0.65) * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 1.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'halftone',
    label: 'Comic Halftone',
    tag: 'fx',
    category: 'fx',
    description: 'Screen-space halftone dots using fragment coordinates mapped against lighting intensity.',
    vert: `varying vec3 vNormal;

void main() {
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    frag: `uniform float u_brightness;
uniform float u_threshold;
uniform float u_freq;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vNormal;

void main() {
  vec3 L = normalize(vec3(1.0, 1.5, 1.0));
  float diff = max(dot(normalize(vNormal), L), 0.0);
  
  vec2 screenCoords = gl_FragCoord.xy / (u_freq * 2.0);
  float pattern = (sin(screenCoords.x) * sin(screenCoords.y)) * 0.5 + 0.5;
  
  // Map diffuse lighting to the dot threshold
  float dotThreshold = smoothstep(u_threshold - 0.2, u_threshold + 0.2, diff);
  float halftone = step(pattern, dotThreshold);
  
  vec3 col = mix(u_color2, u_color1, halftone);
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_freq: 2.0,
      u_threshold: 0.5,
      u_color1: '#ffffff',
      u_color2: '#1a1a2e',
      u_color3: '#ff0000'
    }
  },
  {
    id: 'glitch',
    label: 'Digital Glitch',
    tag: 'fx',
    category: 'fx',
    description: 'Vertex slicing and screen-space color splitting based on time and height.',
    vert: `uniform float u_time;
uniform float u_freq;
uniform float u_warp;

varying vec2 vUv;
varying vec3 vColor;
varying float vGlitchAmt;

void main() {
  vColor = color;
  vec3 pos = position;
  
  // Create blocky glitch slices
  float block = step(0.8, fract(pos.y * u_freq + u_time * 5.0));
  float glitchAmt = step(0.9, fract(u_time * 2.0));
  vGlitchAmt = block * glitchAmt;
  
  pos.x += vGlitchAmt * u_warp * 0.3;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,
    frag: `uniform float u_brightness;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vColor;
varying float vGlitchAmt;

void main() {
  vec3 col = mix(u_color2, u_color1, vColor.r); // Fallback color mix
  
  // Simulate chromatic split on glitchy areas
  if (vGlitchAmt > 0.0) {
    col.r += 0.5;
    col.b -= 0.5;
  }
  
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_freq: 5.0,
      u_warp: 1.0,
      u_color1: '#00ffcc',
      u_color2: '#200050',
      u_color3: '#ff0055'
    }
  },
  {
    id: 'force_field',
    label: 'Hex Force Field',
    tag: 'scifi',
    category: 'fx',
    description: 'Energy shield effect with intersecting waves and rim lighting.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_freq;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rim = 1.0 - max(dot(normalize(vNormal), viewDir), 0.0);
  rim = smoothstep(0.4, 1.0, rim);
  
  // Tri-directional waves to simulate hex grid logic
  vec2 uv = vWorldPos.xy * u_freq;
  float wave1 = sin(uv.x + u_time * 2.0);
  float wave2 = sin(uv.x * 0.5 + uv.y * 0.866 + u_time * 2.0);
  float wave3 = sin(uv.x * 0.5 - uv.y * 0.866 + u_time * 2.0);
  
  float shield = max(wave1, max(wave2, wave3));
  shield = smoothstep(0.8, 1.0, shield);
  
  vec3 col = mix(u_color2, u_color1, shield + rim);
  
  gl_FragColor = vec4(col * u_brightness, rim * 0.8 + shield * 0.5);
}`,
    defaultUniforms: {
      u_brightness: 1.5,
      u_freq: 4.0,
      u_color1: '#00ccff',
      u_color2: '#001133',
      u_color3: '#ffffff'
    }
  },

  // ==========================================
  //            ANIMATED (7)
  // ==========================================
  {
    id: 'wave_distort',
    label: 'Wave Distortion',
    tag: 'animated',
    category: 'animated',
    description: 'Vertex wave animation using u_time. Good for water or cloth simulation effects.',
    vert: `uniform float u_time;
uniform float u_warp;
uniform float u_freq;

varying vec3 vNormal;
varying vec3 vColor;

void main() {
  vColor = color;
  vec3 pos = position;
  
  pos.y += sin(pos.x * u_freq + u_time * 2.0) * u_warp * 0.3;
  pos.y += cos(pos.z * u_freq * 0.8 + u_time * 1.6) * u_warp * 0.2;
  
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,
    frag: `uniform float u_brightness;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vColor;
varying vec3 vNormal;

void main() {
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.6 + 0.4;
  float lum = dot(vColor, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(u_color2, u_color1, lum) * diff * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 1.0,
      u_freq: 3.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'pulse_glow',
    label: 'Pulse Glow',
    tag: 'animated',
    category: 'animated',
    description: 'Animated radial brightness pulse from center. Creates heartbeat or energy pulse effect.',
    vert: `varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_warp;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  float dist = length(vWorldPos.xz);
  float pulse = sin(dist * u_warp * 0.5 - u_time * 2.0) * 0.5 + 0.5;
  
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.5 + 0.5;
  
  vec3 col = mix(u_color2, u_color1, pulse) * diff * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 2.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'dissolve',
    label: 'Dissolve',
    tag: 'animated',
    category: 'animated',
    description: 'Noise-based alpha clip dissolve with configurable threshold. Use u_threshold to control.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vColor;

void main() {
  vColor = color;
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_threshold;
uniform float u_freq;
uniform float u_brightness;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vColor;

float hash(vec3 p) { 
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); 
}

float noise(vec3 p) {
  vec3 i = floor(p); 
  vec3 f = fract(p); 
  f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                 mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                 mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
}

void main() {
  float n = noise(vWorldPos * u_freq + vec3(0.0, 0.0, u_time * 0.2));
  if(n < u_threshold) discard;
  
  float edge = smoothstep(u_threshold, u_threshold + 0.05, n);
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.6 + 0.4;
  vec3 col = mix(u_color2, vColor * diff, edge) * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_threshold: 0.5,
      u_freq: 3.0,
      u_brightness: 1.0,
      u_color1: '#4fffb0',
      u_color2: '#ff6b6b',
      u_color3: '#0a0020'
    }
  },
  {
    id: 'lava',
    label: 'Lava Lamp',
    tag: 'animated',
    category: 'animated',
    description: 'Animated lava lamp effect with fbm noise pattern. Orange/red/yellow color ramp.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_freq;
uniform float u_warp;

varying vec3 vWorldPos;
varying vec3 vNormal;

float hash(vec2 p) { 
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); 
}

float noise(vec2 p) {
  vec2 i = floor(p); 
  vec2 f = fract(p); 
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0; 
  float a = 0.5;
  for(int i=0;i<5;i++){ 
    v += a*noise(p); 
    p*=2.0; 
    a*=0.5; 
  }
  return v;
}

void main() {
  vec2 uv = vWorldPos.xz * u_freq * 0.1 + vec2(u_time * 0.03, u_time * 0.02);
  float n = fbm(uv + fbm(uv + fbm(uv)));
  n = clamp(n, 0.0, 1.0);
  
  vec3 lava1 = vec3(0.02, 0.0, 0.0);
  vec3 lava2 = vec3(0.6, 0.05, 0.0);
  vec3 lava3 = vec3(1.0, 0.4, 0.0);
  vec3 lava4 = vec3(1.0, 0.9, 0.3);
  
  vec3 col;
  if(n < 0.33) col = mix(lava1, lava2, n/0.33);
  else if(n < 0.66) col = mix(lava2, lava3, (n-0.33)/0.33);
  else col = mix(lava3, lava4, (n-0.66)/0.34);
  
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.3 + 0.7;
  col *= diff * u_brightness;
  
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_freq: 3.0,
      u_warp: 1.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
  {
    id: 'breathing',
    label: 'Breathing Mesh',
    tag: 'animated',
    category: 'animated',
    description: 'Pulsing vertex displacement along surface normals over time.',
    vert: `uniform float u_time;
uniform float u_freq;
uniform float u_warp;

varying vec3 vNormal;

void main() {
  vNormal = normalMatrix * normal;
  
  // Displace vertices along their normal vector
  float pulse = sin(u_time * u_freq) * 0.5 + 0.5;
  vec3 newPosition = position + normal * pulse * u_warp * 0.2;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}`,
    frag: `uniform float u_brightness;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vNormal;

void main() {
  vec3 light = normalize(vec3(1.0, 2.0, 1.5));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.7 + 0.3;
  
  vec3 col = mix(u_color2, u_color1, diff);
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.2,
      u_freq: 2.0,
      u_warp: 1.0,
      u_color1: '#ff44aa',
      u_color2: '#1a0033',
      u_color3: '#ffffff'
    }
  },
  {
    id: 'plasma',
    label: 'Plasma Flow',
    tag: 'animated',
    category: 'animated',
    description: 'High-frequency moving sine waves creating a colorful fluid plasma effect.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_freq;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vec2 uv = vWorldPos.xz * (u_freq * 0.2);
  
  // Complex layered sine waves
  float v = sin(uv.x + u_time) + sin(uv.y + u_time);
  v += sin(uv.x * 2.0 - u_time) + sin(uv.y * 1.5 + u_time * 1.5);
  
  float colorMix = v * 0.25 + 0.5;
  
  vec3 light = normalize(vec3(0.0, 1.0, 0.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.5 + 0.5;
  
  vec3 col = mix(u_color2, u_color1, colorMix);
  gl_FragColor = vec4(col * diff * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.1,
      u_freq: 4.0,
      u_color1: '#00ffcc',
      u_color2: '#000088',
      u_color3: '#ffffff'
    }
  },
  {
    id: 'matrix_rain',
    label: 'Digital Rain',
    tag: 'animated',
    category: 'animated',
    description: 'Falling digital rain streams using procedural 2D noise and world Y coordinates.',
    vert: `varying vec3 vWorldPos;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_freq;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec3 vWorldPos;

void main() {
  float time = u_time * 2.0;
  
  // Create a grid on X and Z
  vec2 grid = floor(vWorldPos.xz * u_freq * 2.0);
  
  // Random offset per grid cell
  float rand = fract(sin(dot(grid, vec2(12.9898, 78.233))) * 43758.5453);
  
  // Moving lines down the Y axis
  float drop = fract(vWorldPos.y * u_freq * 0.2 - time * rand * 0.5);
  
  // Make the tip bright and fade the tail
  float glow = smoothstep(0.7, 1.0, drop);
  float tip = smoothstep(0.98, 1.0, drop);
  
  vec3 col = mix(u_color2, u_color1, glow);
  col += tip * vec3(1.0); // white tip
  
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_freq: 5.0,
      u_color1: '#00ff00',
      u_color2: '#001100',
      u_color3: '#ffffff'
    }
  },
  {
    id: 'matcap',
    label: 'Matcap / Studio Sphere',
    tag: 'material',
    category: 'surface',
    description: 'Fakes a studio environment sphere by mapping normals to a matcap UV. Gives a glossy clay/metal look without any textures.',
    vert: `varying vec3 vNormal;
varying vec3 vViewNormal;
 
void main() {
  vNormal = normalMatrix * normal;
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vViewNormal = normalize(mat3(modelViewMatrix) * normal);
  gl_Position = projectionMatrix * mvPos;
}`,
    frag: `uniform float u_brightness;
uniform vec3 u_color1;
uniform vec3 u_color2;
 
varying vec3 vNormal;
varying vec3 vViewNormal;
 
void main() {
  vec2 muv = vViewNormal.xy * 0.5 + 0.5;
  float ring = length(muv - 0.5) * 2.0;
  float gloss = pow(1.0 - clamp(ring, 0.0, 1.0), 3.0);
  float mid = 1.0 - abs(ring - 0.45) * 6.0;
  mid = clamp(mid, 0.0, 1.0);
  vec3 col = mix(u_color2, u_color1, gloss + mid * 0.4) * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_color1: '#ffffff',
      u_color2: '#1a1a2e',
      u_color3: '#4fffb0'
    }
  },
 
  {
    id: 'rimlight',
    label: 'Rim Light',
    tag: 'material',
    category: 'surface',
    description: 'Classic three-point lighting with a strong fresnel rim. u_color1 tints the rim, u_color2 is the fill shadow.',
    vert: `varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vColor;
 
void main() {
  vColor = color;
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_brightness;
uniform float u_warp;
uniform vec3 u_color1;
uniform vec3 u_color2;
 
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vColor;
 
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(vec3(3.0, 5.0, 4.0));
 
  float diff = max(dot(N, L), 0.0) * 0.7 + 0.15;
  float rim  = pow(1.0 - max(dot(N, V), 0.0), 2.0 + u_warp * 2.0);
 
  vec3 base = mix(u_color2, vColor, diff);
  vec3 col  = base + u_color1 * rim * 0.9;
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 0.5,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
 
  {
    id: 'wireframe_overlay',
    label: 'Wireframe Overlay',
    tag: 'debug',
    category: 'surface',
    description: 'Barycentric wireframe rendered in-shader without geometry changes. u_threshold controls line width, u_color1 is the wire color.',
    vert: `varying vec3 vBary;
varying vec3 vColor;
 
void main() {
  vColor = color;
  float id = mod(float(gl_VertexID), 3.0);
  vBary = vec3(id == 0.0 ? 1.0 : 0.0,
               id == 1.0 ? 1.0 : 0.0,
               id == 2.0 ? 1.0 : 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    frag: `uniform float u_brightness;
uniform float u_threshold;
uniform vec3 u_color1;
 
varying vec3 vBary;
varying vec3 vColor;
 
void main() {
  vec3 d = fwidth(vBary);
  vec3 a = smoothstep(d * (u_threshold * 4.0 + 0.5), d * (u_threshold * 4.0 + 1.5), vBary);
  float wire = 1.0 - min(min(a.x, a.y), a.z);
  vec3 col = mix(vColor, u_color1, wire) * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_threshold: 0.5,
      u_color1: '#00ffcc',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
 
  {
    id: 'depth_fog',
    label: 'Depth Fog',
    tag: 'surface',
    category: 'surface',
    description: 'Distance-based exponential fog blended over vertex color. u_color2 is the fog color, u_warp controls fog density.',
    vert: `varying vec3 vColor;
varying vec3 vNormal;
varying float vDist;
 
void main() {
  vColor = color;
  vNormal = normalMatrix * normal;
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vDist = -mvPos.z;
  gl_Position = projectionMatrix * mvPos;
}`,
    frag: `uniform float u_brightness;
uniform float u_warp;
uniform vec3 u_color2;
 
varying vec3 vColor;
varying vec3 vNormal;
varying float vDist;
 
void main() {
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.65 + 0.35;
  vec3 lit = vColor * diff * u_brightness;
 
  float fog = 1.0 - exp(-vDist * u_warp * 0.05);
  fog = clamp(fog, 0.0, 1.0);
  vec3 col = mix(lit, u_color2, fog);
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 1.0,
      u_color1: '#4fffb0',
      u_color2: '#c8d8f0',
      u_color3: '#ff6b6b'
    }
  },
 
// ═══════════════════════════════════════════════════════════════════
// STYLIZED / FX  (4 new)
// ═══════════════════════════════════════════════════════════════════
 
  {
    id: 'outline',
    label: 'Ink Outline',
    tag: 'stylized',
    category: 'fx',
    description: 'Two-pass style ink outline using normal-bias shell expansion. u_color1 is the line color, u_warp controls thickness.',
    vert: `varying vec3 vNormal;
varying vec3 vColor;
 
void main() {
  vNormal = normalMatrix * normal;
  vColor = color;
  vec3 pos = position + normal * u_warp * 0.015;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,
    frag: `uniform float u_brightness;
uniform float u_warp;
uniform vec3 u_color1;
 
varying vec3 vNormal;
varying vec3 vColor;
 
void main() {
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0);
  float bands = floor(diff * 3.0) / 3.0;
  float lum = dot(vColor, vec3(0.299, 0.587, 0.114));
 
  vec3 col = vColor * (bands * 0.6 + 0.3) * u_brightness;
  float edge = 1.0 - smoothstep(0.3, 0.31, diff);
  col = mix(col, u_color1, edge * 0.9);
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 0.5,
      u_color1: '#111111',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
 
  {
    id: 'glitch2',
    label: 'Glitch / Datamosh',
    tag: 'fx',
    category: 'fx',
    description: 'Animated RGB-split and block-offset glitch effect. u_warp controls intensity, u_freq controls block size.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;
 
void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_warp;
uniform float u_freq;
uniform vec3 u_color1;
uniform vec3 u_color2;
 
varying vec3 vWorldPos;
varying vec3 vNormal;
 
float hash(float n) { return fract(sin(n) * 43758.5453); }
 
void main() {
  float block = floor(vWorldPos.y * u_freq * 0.5);
  float glitchRow = step(0.92, hash(block + floor(u_time * 8.0)));
  float shift = (hash(block * 2.71 + u_time) - 0.5) * u_warp * 0.3;
 
  vec3 N = normalize(vNormal);
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(N, light), 0.0) * 0.6 + 0.4;
 
  float r = diff + glitchRow * shift * 2.0;
  float g = diff;
  float b = diff - glitchRow * shift * 2.0;
 
  vec3 base = mix(u_color2, u_color1, diff);
  vec3 col = vec3(
    mix(base.r, r, glitchRow),
    mix(base.g, g, glitchRow * 0.5),
    mix(base.b, b, glitchRow)
  ) * u_brightness;
 
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 1.0,
      u_freq: 8.0,
      u_color1: '#e0e0ff',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
 
  {
    id: 'stipple',
    label: 'Stipple / Halftone',
    tag: 'stylized',
    category: 'fx',
    description: 'Screen-space halftone dot pattern where dot size is driven by luminance. u_freq controls dot grid scale.',
    vert: `varying vec3 vNormal;
varying vec3 vColor;
 
void main() {
  vNormal = normalMatrix * normal;
  vColor = color;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    frag: `uniform float u_brightness;
uniform float u_freq;
uniform vec3 u_color1;
uniform vec3 u_color2;
 
varying vec3 vNormal;
varying vec3 vColor;
 
void main() {
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.7 + 0.3;
  float lum = dot(vColor * diff, vec3(0.299, 0.587, 0.114));
 
  vec2 grid = fract(gl_FragCoord.xy / (u_freq * 1.5 + 1.0)) - 0.5;
  float dot_ = length(grid);
  float radius = (1.0 - lum) * 0.55;
  float stipple = step(dot_, radius);
 
  vec3 col = mix(u_color1, u_color2, stipple) * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_freq: 4.0,
      u_color1: '#f5f0e8',
      u_color2: '#1a1008',
      u_color3: '#ff6b6b'
    }
  },
 
  {
    id: 'neon_glow',
    label: 'Neon Glow',
    tag: 'fx',
    category: 'fx',
    description: 'Fresnel-driven neon edge glow with animated color cycling. u_color1 sets the glow tint, u_warp controls bloom spread.',
    vert: `varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vColor;
 
void main() {
  vColor = color;
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_warp;
uniform vec3 u_color1;
uniform vec3 u_color2;
 
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vColor;
 
void main() {
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 N = normalize(vNormal);
  float rim = pow(1.0 - abs(dot(N, V)), 1.5 + u_warp);
 
  float cycle = u_time * 0.4;
  vec3 glow = vec3(
    abs(sin(cycle)),
    abs(sin(cycle + 2.094)),
    abs(sin(cycle + 4.189))
  );
  glow = mix(u_color1, glow, 0.5);
 
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(N, light), 0.0) * 0.5 + 0.25;
  vec3 base = mix(u_color2, vColor * diff, 0.6);
 
  vec3 col = base + glow * rim * 1.8;
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_warp: 0.5,
      u_color1: '#ff00ff',
      u_color2: '#050510',
      u_color3: '#00ffff'
    }
  },
 
// ═══════════════════════════════════════════════════════════════════
// ANIMATED  (4 new)
// ═══════════════════════════════════════════════════════════════════
 
  {
    id: 'voronoi_flow',
    label: 'Voronoi Flow',
    tag: 'animated',
    category: 'animated',
    description: 'Animated voronoi cell pattern flowing across the surface. u_freq controls cell size, u_warp controls distortion.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;
 
void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_freq;
uniform float u_warp;
uniform vec3 u_color1;
uniform vec3 u_color2;
 
varying vec3 vWorldPos;
varying vec3 vNormal;
 
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
 
float voronoi(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float minDist = 8.0;
  for(int y = -1; y <= 1; y++) {
    for(int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = hash2(i + neighbor);
      point = 0.5 + 0.5 * sin(u_time * 0.8 + 6.2831 * point);
      vec2 diff = neighbor + point - f;
      minDist = min(minDist, length(diff));
    }
  }
  return minDist;
}
 
void main() {
  vec2 uv = vWorldPos.xz * u_freq * 0.12 + vWorldPos.y * u_warp * 0.05;
  float v = voronoi(uv);
  float cell = smoothstep(0.0, 0.15, v) * smoothstep(1.0, 0.3, v);
 
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.5 + 0.5;
  vec3 col = mix(u_color2, u_color1, cell) * diff * u_brightness;
  gl_FragColor = vec4(col, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_freq: 4.0,
      u_warp: 1.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  },
 
  {
    id: 'lightning',
    label: 'Electric / Lightning',
    tag: 'animated',
    category: 'animated',
    description: 'Animated electric arc pattern crawling over the surface using layered noise. u_color1 is the arc color.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;
 
void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_freq;
uniform float u_warp;
uniform vec3 u_color1;
uniform vec3 u_color2;
 
varying vec3 vWorldPos;
varying vec3 vNormal;
 
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
 
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
 
void main() {
  vec2 uv = vWorldPos.xz * u_freq * 0.2 + vec2(u_time * 0.1, vWorldPos.y * 0.15);
  float t = u_time * 2.0;
 
  float n1 = noise(uv + vec2(t * 0.3, 0.0));
  float n2 = noise(uv * 2.0 - vec2(0.0, t * 0.5));
  float n3 = noise(uv * 4.0 + vec2(t * 0.7, t * 0.2));
  float arc = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
 
  float bolt = pow(max(0.0, 1.0 - abs(arc - 0.5) * u_warp * 4.0), 4.0);
  float flicker = 0.8 + sin(t * 13.7) * 0.1 + sin(t * 7.3) * 0.1;
 
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.4 + 0.3;
  vec3 base = u_color2 * diff;
  vec3 col = base + u_color1 * bolt * flicker * 2.5;
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.2,
      u_freq: 5.0,
      u_warp: 1.0,
      u_color1: '#aaddff',
      u_color2: '#050520',
      u_color3: '#ff6b6b'
    }
  },
 
  {
    id: 'caustics',
    label: 'Caustics / Water',
    tag: 'animated',
    category: 'animated',
    description: 'Animated water caustic light patterns from overlapping sine waves. Simulates underwater light refraction.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vColor;
 
void main() {
  vColor = color;
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_freq;
uniform float u_warp;
uniform vec3 u_color1;
uniform vec3 u_color2;
 
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vColor;
 
float caustic(vec2 p, float t) {
  float v = 0.0;
  float amp = 1.0;
  for(int i = 0; i < 4; i++) {
    float fi = float(i);
    v += sin(p.x * (1.3 + fi * 0.4) + t * (0.9 + fi * 0.15)) * amp;
    v += sin(p.y * (1.1 + fi * 0.5) + t * (1.1 - fi * 0.12)) * amp;
    v += sin((p.x + p.y) * (0.8 + fi * 0.3) + t * 0.7) * amp;
    amp *= 0.55;
  }
  return v;
}
 
void main() {
  vec2 uv = vWorldPos.xz * u_freq * 0.15;
  float c1 = caustic(uv, u_time * 0.6);
  float c2 = caustic(uv * 1.3 + 1.7, u_time * 0.5 + 1.2);
  float pattern = abs(c1 - c2);
  pattern = 1.0 - clamp(pattern * u_warp * 0.3, 0.0, 1.0);
  pattern = pow(pattern, 2.5);
 
  vec3 light = normalize(vec3(0.0, 1.0, 0.3));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.5 + 0.4;
  vec3 base = mix(u_color2, vColor * diff, 0.7);
  vec3 col = base + u_color1 * pattern * 0.8;
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_freq: 3.0,
      u_warp: 1.5,
      u_color1: '#80d8ff',
      u_color2: '#001a33',
      u_color3: '#4fffb0'
    }
  },
 
  {
    id: 'magnetic_field',
    label: 'Magnetic Field',
    tag: 'animated',
    category: 'animated',
    description: 'Animated field lines emanating from poles along the Y axis. Simulates magnetic flux visualization.',
    vert: `varying vec3 vWorldPos;
varying vec3 vNormal;
 
void main() {
  vNormal = normalMatrix * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    frag: `uniform float u_time;
uniform float u_brightness;
uniform float u_freq;
uniform float u_warp;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
 
varying vec3 vWorldPos;
varying vec3 vNormal;
 
void main() {
  vec3 pole1 = vec3(0.0,  8.0, 0.0);
  vec3 pole2 = vec3(0.0, -8.0, 0.0);
 
  vec3 d1 = normalize(pole1 - vWorldPos);
  vec3 d2 = normalize(pole2 - vWorldPos);
 
  float r1 = length(pole1 - vWorldPos);
  float r2 = length(pole2 - vWorldPos);
 
  float field = dot(d1, d2);
  field = abs(field);
 
  float lines = sin(field * u_freq * 3.14159 + u_time * 1.5) * 0.5 + 0.5;
  lines = pow(lines, 3.0);
 
  float proximity = (1.0 / (r1 * r1 + 0.5) + 1.0 / (r2 * r2 + 0.5)) * u_warp * 2.0;
  proximity = clamp(proximity, 0.0, 1.0);
 
  vec3 light = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(normalize(vNormal), light), 0.0) * 0.4 + 0.4;
 
  vec3 col = mix(u_color2, u_color1, lines) * diff;
  col = mix(col, u_color3, proximity);
  gl_FragColor = vec4(col * u_brightness, 1.0);
}`,
    defaultUniforms: {
      u_brightness: 1.0,
      u_freq: 4.0,
      u_warp: 1.0,
      u_color1: '#4fffb0',
      u_color2: '#0a0020',
      u_color3: '#ff6b6b'
    }
  }
];

export function getPresetById(id) {
  return PRESETS.find(p => p.id === id) || PRESETS[0];
}

export function getPresetsByCategory(category) {
  return PRESETS.filter(p => p.category === category);
}

export default PRESETS;