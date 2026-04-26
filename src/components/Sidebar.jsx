import React from 'react';
import { SceneTab } from './tabs/SceneTab';
import { ShaderTab } from './tabs/ShaderTab';
import { ExportTab } from './tabs/ExportTab';
import { CodeTab } from './tabs/CodeTab';
import { useStudio, getPresetById } from '../context/StudioContext';
import logo from '@/assets/logo.png';

export function Sidebar({
  // Scene props
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
  onSetGLBActive,
  
  // Shader props
  onPresetSelect,
  onVertChange,
  onFragChange,
  onCompile,
  onResetShader,
  onUniformChange,
  
  // Export props
  onNavigateToCode
}) {
  const {
    activeTab,
    setActiveTab,
    activeTarget,
    PRESETS,
    activePresetId,
    vertSrc,
    fragSrc,
    shaderError,
    isCompiling,
    uiUniforms,
    uniformsRef,
    presetCategory
  } = useStudio();
  
  const preset = getPresetById(activePresetId);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'scene':
        return (
          <SceneTab
            terrainConfig={terrainConfig}
            onTerrainChange={onTerrainChange}
            onTerrainRegenerate={onTerrainRegenerate}
            primitiveConfig={primitiveConfig}
            onPrimitiveChange={onPrimitiveChange}
            glbData={glbData}
            onGLBLoad={onGLBLoad}
            onGLBClear={onGLBClear}
            onSetTerrainActive={onSetTerrainActive}
            onSetPrimitiveActive={onSetPrimitiveActive}
            onSetGLBActive={onSetGLBActive}
          />
        );
      case 'shader':
        return (
          <ShaderTab
            presets={PRESETS}
            activePresetId={activePresetId}
            onPresetSelect={onPresetSelect}
            vertSrc={vertSrc}
            fragSrc={fragSrc}
            onVertChange={onVertChange}
            onFragChange={onFragChange}
            onCompile={onCompile}
            onReset={onResetShader}
            shaderError={shaderError}
            isCompiling={isCompiling}
            uiUniforms={uiUniforms}
            onUniformChange={onUniformChange}
            presetDescription={preset?.description}
          />
        );
      case 'export':
        return (
          <ExportTab
            activeTarget={activeTarget}
            onNavigateToCode={onNavigateToCode}
          />
        );
      case 'code':
        return (
          <CodeTab
            vertSrc={vertSrc}
            fragSrc={fragSrc}
            uniforms={uniformsRef.current}
            presetCategory={presetCategory}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="sidebar">
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <img
      src={logo}
      alt="Shader Studio Logo"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-sm)',
        objectFit: 'cover',
      }}
    />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Shader Studio</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Universal Shader Editor</div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tab-list">
        <button
          className={`tab-button scene ${activeTab === 'scene' ? 'active' : ''}`}
          onClick={() => setActiveTab('scene')}
        >
          Scene
        </button>
        <button
          className={`tab-button shader ${activeTab === 'shader' ? 'active' : ''}`}
          onClick={() => setActiveTab('shader')}
        >
          Shader
        </button>
        <button
          className={`tab-button export ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export
        </button>
        <button
          className={`tab-button code ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          Code
        </button>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}

export default Sidebar;
