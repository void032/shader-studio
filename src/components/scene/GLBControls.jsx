import React from 'react';
import { FileDropZone } from '../ui/FileDropZone';

export function GLBControls({
  glbData,
  onFileSelect,
  onClear
}) {
  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Upload GLB</span>
      </div>
      <div className="section-content">
        {!glbData ? (
          <FileDropZone
            onFileSelect={onFileSelect}
            accept=".glb"
          />
        ) : (
          <div>
            <div className="file-info" style={{ marginBottom: '12px' }}>
              <div className="file-name">{glbData.name}</div>
              <div className="file-stats">
                {glbData.vertCount.toLocaleString()} vertices · {glbData.triCount.toLocaleString()} triangles
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-warn" onClick={onClear}>
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GLBControls;
