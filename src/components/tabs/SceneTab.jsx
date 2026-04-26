import React from 'react';
import { TerrainControls } from '../scene/TerrainControls';
import { GLBControls } from '../scene/GLBControls';
import { PrimitiveControls } from '../scene/PrimitiveControls';
import { useStudio, TARGET_TYPES } from '../../context/StudioContext';

export function SceneTab({
  terrainConfig,
  onTerrainChange,
  onTerrainRegenerate,
  primitiveConfig,
  onPrimitiveChange,
  glbData,
  onGLBLoad,
  onGLBClear,
  onSetTerrainActive,
  onSetPrimitiveActive,
  onSetGLBActive
}) {
  const { activeTarget } = useStudio();
  
  return (
    <div className="tab-content">
      {/* Terrain Section */}
      <TerrainControls
        config={terrainConfig}
        onChange={onTerrainChange}
        onRegenerate={onTerrainRegenerate}
        onSetActive={onSetTerrainActive}
      />
      
      {/* GLB Upload Section */}
      <GLBControls
        glbData={glbData}
        onFileSelect={onGLBLoad}
        onClear={onGLBClear}
      />
      
      {/* Primitives Section */}
      <PrimitiveControls
        config={primitiveConfig}
        onChange={onPrimitiveChange}
        onSetActive={onSetPrimitiveActive}
      />
    </div>
  );
}

export default SceneTab;
