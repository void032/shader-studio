import React from 'react';
import { exportGLB, exportOBJ, exportSTL } from '../../lib/exporters';
import { useStudio } from '../../context/StudioContext';

export function ExportTab({
  activeTarget,
  onNavigateToCode
}) {
  const { showToast } = useStudio();
  
  const handleExportGLB = () => {
    if (!activeTarget.mesh) {
      showToast('No active target to export', 'error');
      return;
    }
    
    let geometry;
    if (activeTarget.type === 'glb') {
      // For GLB, try to get merged geometry or use first mesh
      activeTarget.mesh.traverse((child) => {
        if (child.isMesh && !geometry) {
          geometry = child.geometry;
        }
      });
    } else {
      geometry = activeTarget.mesh.geometry;
    }
    
    if (geometry) {
      exportGLB(geometry, activeTarget.name || 'model');
      showToast('GLB exported successfully');
    }
  };
  
  const handleExportOBJ = () => {
    if (!activeTarget.mesh) {
      showToast('No active target to export', 'error');
      return;
    }
    
    let geometry;
    if (activeTarget.type === 'glb') {
      activeTarget.mesh.traverse((child) => {
        if (child.isMesh && !geometry) {
          geometry = child.geometry;
        }
      });
    } else {
      geometry = activeTarget.mesh.geometry;
    }
    
    if (geometry) {
      exportOBJ(geometry, activeTarget.name || 'model');
      showToast('OBJ exported successfully');
    }
  };
  
  const handleExportSTL = () => {
    if (!activeTarget.mesh) {
      showToast('No active target to export', 'error');
      return;
    }
    
    let geometry;
    if (activeTarget.type === 'glb') {
      activeTarget.mesh.traverse((child) => {
        if (child.isMesh && !geometry) {
          geometry = child.geometry;
        }
      });
    } else {
      geometry = activeTarget.mesh.geometry;
    }
    
    if (geometry) {
      exportSTL(geometry, activeTarget.name || 'model');
      showToast('STL exported successfully');
    }
  };
  
  return (
    <div className="tab-content">
      {/* 3D Model Export */}
      <div className="export-card">
        <div className="export-title">3D Model Export</div>
        <div className="export-desc">
          Export the current active target ({activeTarget.name || 'None'}) as a 3D model file.
        </div>
        <div className="export-buttons">
          <button
            className="btn btn-secondary"
            onClick={handleExportGLB}
            disabled={!activeTarget.mesh}
          >
            Export GLB
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportOBJ}
            disabled={!activeTarget.mesh}
          >
            Export OBJ
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportSTL}
            disabled={!activeTarget.mesh}
          >
            Export STL
          </button>
        </div>
      </div>
      
      {/* Shader Code Export */}
      <div className="export-card">
        <div className="export-title">Shader Code</div>
        <div className="export-desc">
          Export the current shader as ready-to-use code for your project.
        </div>
        <button className="btn btn-accent3" onClick={onNavigateToCode}>
          Go to Code Tab →
        </button>
      </div>
      
      {/* Export Info */}
      <div style={{ 
        padding: '12px', 
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        color: 'var(--text-dim)',
        lineHeight: 1.6
      }}>
        <strong style={{ color: 'var(--text)' }}>Current Target:</strong>
        <div style={{ marginTop: '6px' }}>
          Type: {activeTarget.type || 'None'}
        </div>
        <div>
          Name: {activeTarget.name || 'N/A'}
        </div>
        <div>
          Vertices: {activeTarget.vertCount?.toLocaleString() || 0}
        </div>
        <div>
          Triangles: {activeTarget.triCount?.toLocaleString() || 0}
        </div>
      </div>
    </div>
  );
}

export default ExportTab;
