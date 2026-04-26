// 3D Model Exporters - GLB, OBJ, STL

// Helper: Pad array to 4-byte boundary and ALWAYS return a Uint8Array
function pad4(arr) {
  const remainder = arr.byteLength % 4;
  const padding = remainder === 0 ? 0 : 4 - remainder;
  const padded = new Uint8Array(arr.byteLength + padding);
  
  // CRITICAL FIX: We must create a Uint8Array view of the buffer to copy RAW BYTES,
  // otherwise JS will convert floats to ints and corrupt the geometry.
  padded.set(new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength), 0);
  
  return padded;
}

// Helper: Write string to Uint8Array
function stringToBytes(str) {
  return new TextEncoder().encode(str);
}

// Export to GLB (binary glTF 2.0)
export function exportGLB(geometry, filename = 'model') {
  const positions = geometry.attributes.position.array;
  const normals = geometry.attributes.normal?.array;
  const colors = geometry.attributes.color?.array;
  const indices = geometry.index?.array;
  
  const vertexCount = positions.length / 3;
  const hasNormals = !!normals;
  const hasColors = !!colors;
  const hasIndices = !!indices;
  
  // Calculate min/max for positions
  let minPos = [Infinity, Infinity, Infinity];
  let maxPos = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < vertexCount; i++) {
    for (let j = 0; j < 3; j++) {
      const v = positions[i * 3 + j];
      minPos[j] = Math.min(minPos[j], v);
      maxPos[j] = Math.max(maxPos[j], v);
    }
  }
  
  // Build buffers
  const buffers = [];
  let byteOffset = 0;
  
  // Index buffer
  let indexBufferView = null;
  let useUint32 = vertexCount > 65535; // FIX: Support high-poly terrains
  
  if (hasIndices) {
    const indexData = useUint32 ? new Uint32Array(indices.length) : new Uint16Array(indices.length);
    for (let i = 0; i < indices.length; i++) {
      indexData[i] = indices[i];
    }
    const paddedIndices = pad4(indexData);
    buffers.push(paddedIndices);
    indexBufferView = {
      buffer: 0,
      byteOffset,
      byteLength: paddedIndices.byteLength,
      target: 34963 // ELEMENT_ARRAY_BUFFER
    };
    byteOffset += paddedIndices.byteLength;
  }
  
  // Position buffer
  const positionData = new Float32Array(positions);
  const paddedPositions = pad4(positionData);
  buffers.push(paddedPositions);
  const positionBufferView = {
    buffer: 0,
    byteOffset,
    byteLength: paddedPositions.byteLength,
    target: 34962 // ARRAY_BUFFER
  };
  byteOffset += paddedPositions.byteLength;
  
  // Normal buffer
  let normalBufferView = null;
  if (hasNormals) {
    const normalData = new Float32Array(normals);
    const paddedNormals = pad4(normalData);
    buffers.push(paddedNormals);
    normalBufferView = {
      buffer: 0,
      byteOffset,
      byteLength: paddedNormals.byteLength,
      target: 34962
    };
    byteOffset += paddedNormals.byteLength;
  }
  
  // Color buffer
  let colorBufferView = null;
  if (hasColors) {
    const colorData = new Float32Array(colors);
    const paddedColors = pad4(colorData);
    buffers.push(paddedColors);
    colorBufferView = {
      buffer: 0,
      byteOffset,
      byteLength: paddedColors.byteLength,
      target: 34962
    };
    byteOffset += paddedColors.byteLength;
  }
  
  // Build accessors
  const accessors = [];
  let bufferViewIndex = 0;
  
  // Index accessor
  if (hasIndices) {
    accessors.push({
      bufferView: bufferViewIndex++,
      componentType: useUint32 ? 5125 : 5123, // UNSIGNED_INT (5125) or UNSIGNED_SHORT (5123)
      count: indices.length,
      type: 'SCALAR'
    });
  }
  
  // Position accessor
  accessors.push({
    bufferView: bufferViewIndex++,
    componentType: 5126, // FLOAT
    count: vertexCount,
    type: 'VEC3',
    min: minPos,
    max: maxPos
  });
  
  // Normal accessor
  if (hasNormals) {
    accessors.push({
      bufferView: bufferViewIndex++,
      componentType: 5126,
      count: vertexCount,
      type: 'VEC3'
    });
  }
  
  // Color accessor
  if (hasColors) {
    accessors.push({
      bufferView: bufferViewIndex++,
      componentType: 5126,
      count: vertexCount,
      type: 'VEC3'
    });
  }
  
  // Build mesh attributes
  let accessorIndex = hasIndices ? 1 : 0;
  const attributes = {
    POSITION: accessorIndex++
  };
  if (hasNormals) attributes.NORMAL = accessorIndex++;
  if (hasColors) attributes.COLOR_0 = accessorIndex++;
  
  // Build glTF JSON
  const gltf = {
    asset: {
      version: '2.0',
      generator: 'Shader Studio'
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes,
        mode: 4 // TRIANGLES
      }]
    }],
    buffers: [{ byteLength: byteOffset }],
    bufferViews: [
      ...(hasIndices ? [indexBufferView] : []),
      positionBufferView,
      ...(hasNormals ? [normalBufferView] : []),
      ...(hasColors ? [colorBufferView] : [])
    ],
    accessors
  };
  
  // Add indices to primitive if present
  if (hasIndices) {
    gltf.meshes[0].primitives[0].indices = 0;
  }
  
  // Build binary GLB
  const jsonStr = JSON.stringify(gltf);
  const jsonBytes = stringToBytes(jsonStr);
  
  // Ensure JSON chunk is padded with spaces (0x20)
  const jsonRemainder = jsonBytes.byteLength % 4;
  const jsonPadding = jsonRemainder === 0 ? 0 : 4 - jsonRemainder;
  const jsonPadded = new Uint8Array(jsonBytes.byteLength + jsonPadding);
  jsonPadded.set(jsonBytes);
  for (let i = 0; i < jsonPadding; i++) {
    jsonPadded[jsonBytes.byteLength + i] = 0x20; 
  }
  
  // Concatenate all buffer data
  const binData = new Uint8Array(byteOffset);
  let offset = 0;
  for (const buf of buffers) {
    binData.set(buf, offset);
    offset += buf.byteLength;
  }
  
  // Build GLB header and chunks
  const glbHeader = new Uint32Array([
    0x46546C67, // magic "glTF"
    2,          // version
    12 + 8 + jsonPadded.byteLength + 8 + binData.byteLength // total length
  ]);
  
  const jsonChunk = new Uint32Array([
    jsonPadded.byteLength,
    0x4E4F534A  // chunk type "JSON"
  ]);
  
  const binChunk = new Uint32Array([
    binData.byteLength,
    0x004E4942  // chunk type "BIN"
  ]);
  
  // Combine all parts
  const glb = new Uint8Array(glbHeader.byteLength + jsonChunk.byteLength + jsonPadded.byteLength + binChunk.byteLength + binData.byteLength);
  let writeOffset = 0;
  
  glb.set(new Uint8Array(glbHeader.buffer), writeOffset);
  writeOffset += glbHeader.byteLength;
  
  glb.set(new Uint8Array(jsonChunk.buffer), writeOffset);
  writeOffset += jsonChunk.byteLength;
  
  glb.set(jsonPadded, writeOffset);
  writeOffset += jsonPadded.byteLength;
  
  glb.set(new Uint8Array(binChunk.buffer), writeOffset);
  writeOffset += binChunk.byteLength;
  
  glb.set(binData, writeOffset);
  
  // Download
  const blob = new Blob([glb], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${Date.now()}.glb`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export to OBJ (Wavefront)
export function exportOBJ(geometry, filename = 'model') {
  const positions = geometry.attributes.position.array;
  const normals = geometry.attributes.normal?.array;
  const colors = geometry.attributes.color?.array;
  const indices = geometry.index?.array;
  
  const vertexCount = positions.length / 3;
  const hasNormals = !!normals;
  const hasColors = !!colors;
  const hasIndices = !!indices;
  
  let objContent = `# Generated by Shader Studio\n`;
  objContent += `# Vertices: ${vertexCount}\n`;
  objContent += `# ${hasIndices ? 'Indexed' : 'Non-indexed'} geometry\n\n`;
  
  // MTL reference
  objContent += `mtllib ${filename}.mtl\n`;
  objContent += `usemtl default\n\n`;
  
  // Vertices with colors (extended OBJ format)
  for (let i = 0; i < vertexCount; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    
    if (hasColors) {
      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];
      objContent += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)} ${r.toFixed(6)} ${g.toFixed(6)} ${b.toFixed(6)}\n`;
    } else {
      objContent += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
    }
  }
  
  // Normals
  if (hasNormals) {
    objContent += `\n`;
    for (let i = 0; i < vertexCount; i++) {
      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      const nz = normals[i * 3 + 2];
      objContent += `vn ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`;
    }
  }
  
  // Faces
  objContent += `\n`;
  if (hasIndices) {
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] + 1;
      const i2 = indices[i + 1] + 1;
      const i3 = indices[i + 2] + 1;
      
      if (hasNormals) {
        objContent += `f ${i1}//${i1} ${i2}//${i2} ${i3}//${i3}\n`;
      } else {
        objContent += `f ${i1} ${i2} ${i3}\n`;
      }
    }
  } else {
    for (let i = 0; i < vertexCount; i += 3) {
      const i1 = i + 1;
      const i2 = i + 2;
      const i3 = i + 3;
      
      if (hasNormals) {
        objContent += `f ${i1}//${i1} ${i2}//${i2} ${i3}//${i3}\n`;
      } else {
        objContent += `f ${i1} ${i2} ${i3}\n`;
      }
    }
  }
  
  // MTL content
  const mtlContent = `# Generated by Shader Studio\nnewmtl default\nKd 0.8 0.8 0.8\nKa 0.2 0.2 0.2\nKs 0.5 0.5 0.5\nNs 32\n`;
  
  // Download OBJ
  const objBlob = new Blob([objContent], { type: 'text/plain' });
  const objUrl = URL.createObjectURL(objBlob);
  const objA = document.createElement('a');
  objA.href = objUrl;
  objA.download = `${filename}_${Date.now()}.obj`;
  document.body.appendChild(objA);
  objA.click();
  document.body.removeChild(objA);
  URL.revokeObjectURL(objUrl);
  
  // Download MTL
  setTimeout(() => {
    const mtlBlob = new Blob([mtlContent], { type: 'text/plain' });
    const mtlUrl = URL.createObjectURL(mtlBlob);
    const mtlA = document.createElement('a');
    mtlA.href = mtlUrl;
    mtlA.download = `${filename}.mtl`;
    document.body.appendChild(mtlA);
    mtlA.click();
    document.body.removeChild(mtlA);
    URL.revokeObjectURL(mtlUrl);
  }, 100);
}

// Export to STL (binary)
export function exportSTL(geometry, filename = 'model') {
  const positions = geometry.attributes.position.array;
  const normals = geometry.attributes.normal?.array;
  const indices = geometry.index?.array;
  
  const hasNormals = !!normals;
  const hasIndices = !!indices;
  
  // Get triangles
  let triangles = [];
  if (hasIndices) {
    for (let i = 0; i < indices.length; i += 3) {
      triangles.push([indices[i], indices[i + 1], indices[i + 2]]);
    }
  } else {
    for (let i = 0; i < positions.length / 9; i++) {
      triangles.push([i * 3, i * 3 + 1, i * 3 + 2]);
    }
  }
  
  const triangleCount = triangles.length;
  
  // Build binary STL
  const headerSize = 80;
  const triangleSize = 50; // 12 bytes normal + 36 bytes vertices + 2 bytes attribute
  const bufferSize = headerSize + 4 + triangleCount * triangleSize;
  
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);
  
  // Header (80 bytes)
  const header = stringToBytes('Generated by Shader Studio');
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < header.length ? header[i] : 0);
  }
  
  // Triangle count
  view.setUint32(80, triangleCount, true);
  
  // Triangles
  let offset = 84;
  for (const [i1, i2, i3] of triangles) {
    // Calculate face normal if not provided
    let nx, ny, nz;
    
    if (hasNormals) {
      // Average vertex normals
      nx = (normals[i1 * 3] + normals[i2 * 3] + normals[i3 * 3]) / 3;
      ny = (normals[i1 * 3 + 1] + normals[i2 * 3 + 1] + normals[i3 * 3 + 1]) / 3;
      nz = (normals[i1 * 3 + 2] + normals[i2 * 3 + 2] + normals[i3 * 3 + 2]) / 3;
      
      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        nx /= len;
        ny /= len;
        nz /= len;
      }
    } else {
      // Calculate from vertices
      const v1x = positions[i2 * 3] - positions[i1 * 3];
      const v1y = positions[i2 * 3 + 1] - positions[i1 * 3 + 1];
      const v1z = positions[i2 * 3 + 2] - positions[i1 * 3 + 2];
      
      const v2x = positions[i3 * 3] - positions[i1 * 3];
      const v2y = positions[i3 * 3 + 1] - positions[i1 * 3 + 1];
      const v2z = positions[i3 * 3 + 2] - positions[i1 * 3 + 2];
      
      nx = v1y * v2z - v1z * v2y;
      ny = v1z * v2x - v1x * v2z;
      nz = v1x * v2y - v1y * v2x;
      
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        nx /= len;
        ny /= len;
        nz /= len;
      }
    }
    
    // Normal (12 bytes)
    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);
    offset += 12;
    
    // Vertices (36 bytes)
    for (const idx of [i1, i2, i3]) {
      view.setFloat32(offset, positions[idx * 3], true);
      view.setFloat32(offset + 4, positions[idx * 3 + 1], true);
      view.setFloat32(offset + 8, positions[idx * 3 + 2], true);
      offset += 12;
    }
    
    // Attribute byte count (2 bytes, usually 0)
    view.setUint16(offset, 0, true);
    offset += 2;
  }
  
  // Download
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${Date.now()}.stl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}