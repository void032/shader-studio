// ShaderTab.jsx - Main component for shader editing and preset management
import React, { useState, useCallback } from 'react';
import { Slider } from '../ui/Slider';
import { ColorSwatch } from '../ui/ColorSwatch';
import { useStudio } from '../../context/StudioContext';

// Check if uniform is used in shader source
function uniformIsUsed(uniformName, vertSrc, fragSrc) {
  const pattern = new RegExp(`\\b${uniformName}\\b`);
  return pattern.test(vertSrc) || pattern.test(fragSrc);
}

export function ShaderTab({
  presets,
  activePresetId,
  onPresetSelect,
  vertSrc,
  fragSrc,
  onVertChange,
  onFragChange,
  onCompile,
  onReset,
  shaderError,
  isCompiling,
  uiUniforms,
  onUniformChange,
  presetDescription
}) {
  const [activeVert, setActiveVert] = useState(vertSrc);
  const [activeFrag, setActiveFrag] = useState(fragSrc);
  
  // Update local state when props change
  React.useEffect(() => {
    setActiveVert(vertSrc);
  }, [vertSrc]);
  
  React.useEffect(() => {
    setActiveFrag(fragSrc);
  }, [fragSrc]);
  
  // Handle tab key in textarea
  const handleKeyDown = (e, setter) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      setter(newValue);
      
      // Update parent
      if (setter === setActiveVert) {
        onVertChange(newValue);
      } else {
        onFragChange(newValue);
      }
      
      // Set cursor position after timeout
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };
  
  // Group presets by category
  const presetsByCategory = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {});
  
  const categoryLabels = {
    surface: 'Surface / Material',
    fx: 'Stylized / FX',
    animated: 'Animated'
  };
  
  // Generate line numbers
  const vertLines = activeVert.split('\n').length;
  const fragLines = activeFrag.split('\n').length;
  const vertLineNumbers = Array.from({ length: vertLines }, (_, i) => i + 1).join('\n');
  const fragLineNumbers = Array.from({ length: fragLines }, (_, i) => i + 1).join('\n');
  
  return (
    <div className="tab-content">
      {/* Preset Library */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Preset Library</span>
        </div>
        <div className="section-content">
          {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
            <div key={category}>
              <div className="category-divider">{categoryLabels[category]}</div>
              {categoryPresets.map((preset) => (
                <div
                  key={preset.id}
                  className={`preset-card ${activePresetId === preset.id ? 'active' : ''}`}
                  onClick={() => onPresetSelect(preset.id)}
                >
                  <span className="preset-label">{preset.label}</span>
                  <span className="preset-tag">{preset.tag}</span>
                </div>
              ))}
            </div>
          ))}
          
          {presetDescription && (
            <div style={{ 
              marginTop: '12px', 
              padding: '10px', 
              background: 'rgba(123, 111, 240, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              color: 'var(--text-dim)',
              lineHeight: 1.6
            }}>
              {presetDescription}
            </div>
          )}
        </div>
      </div>
      
      {/* GLSL Editors */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">GLSL Editors</span>
        </div>
        <div className="section-content">
          {/* Vertex Editor */}
          <div className="editor-container">
            <div className="editor-header">
              <span className="editor-label">VERT</span>
              <span className="editor-live">live</span>
            </div>
            <div className="editor-wrapper">
              <div className="line-numbers">{vertLineNumbers}</div>
              <textarea
                className="editor-textarea"
                value={activeVert}
                onChange={(e) => {
                  setActiveVert(e.target.value);
                  onVertChange(e.target.value);
                }}
                onKeyDown={(e) => handleKeyDown(e, setActiveVert)}
                spellCheck={false}
                rows={Math.max(10, vertLines)}
              />
            </div>
          </div>
          
          {/* Fragment Editor */}
          <div className={`editor-container ${shaderError ? 'error' : ''}`}>
            <div className="editor-header">
              <span className="editor-label">FRAG</span>
              <span className="editor-live">live</span>
            </div>
            <div className="editor-wrapper">
              <div className="line-numbers">{fragLineNumbers}</div>
              <textarea
                className="editor-textarea"
                value={activeFrag}
                onChange={(e) => {
                  setActiveFrag(e.target.value);
                  onFragChange(e.target.value);
                }}
                onKeyDown={(e) => handleKeyDown(e, setActiveFrag)}
                spellCheck={false}
                rows={Math.max(15, fragLines)}
              />
            </div>
          </div>
          
          {/* Error Box */}
          {shaderError && (
            <div className="error-box">
              {shaderError}
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              className="btn btn-accent2"
              onClick={onCompile}
              disabled={isCompiling}
            >
              {isCompiling ? (
                <>
                  <span className="spinner" style={{ width: '12px', height: '12px', marginRight: '6px' }} />
                  Compiling...
                </>
              ) : (
                'Compile & Apply'
              )}
            </button>
            <button className="btn btn-secondary" onClick={onReset}>
              Reset to Standard
            </button>
          </div>
        </div>
      </div>
      
      {/* Uniforms Panel */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Uniforms</span>
        </div>
        <div className="section-content">
          {/* Time display (readonly) */}
          <div className="control-row">
            <span className="control-label">u_time</span>
            <span className="control-value" style={{ color: 'var(--text-dim)' }}>auto</span>
          </div>
          
          <Slider
            label="Time Scale"
            value={uiUniforms.timeScale}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => onUniformChange('timeScale', v)}
          />
          
          <Slider
            label="Warp"
            value={uiUniforms.warp}
            min={0}
            max={3}
            step={0.05}
            onChange={(v) => onUniformChange('warp', v)}
          />
          
          <Slider
            label="Brightness"
            value={uiUniforms.brightness}
            min={0.1}
            max={3}
            step={0.05}
            onChange={(v) => onUniformChange('brightness', v)}
          />
          
          {uniformIsUsed('u_steps', vertSrc, fragSrc) && (
            <Slider
              label="Steps"
              value={uiUniforms.steps}
              min={2}
              max={16}
              step={1}
              onChange={(v) => onUniformChange('steps', v)}
            />
          )}
          
          {uniformIsUsed('u_threshold', vertSrc, fragSrc) && (
            <Slider
              label="Threshold"
              value={uiUniforms.threshold}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => onUniformChange('threshold', v)}
            />
          )}
          
          {uniformIsUsed('u_freq', vertSrc, fragSrc) && (
            <Slider
              label="Frequency"
              value={uiUniforms.freq}
              min={0.1}
              max={20}
              step={0.1}
              onChange={(v) => onUniformChange('freq', v)}
            />
          )}
          
          <ColorSwatch
            label="Color 1"
            color={uiUniforms.color1}
            onChange={(v) => onUniformChange('color1', v)}
          />
          
          <ColorSwatch
            label="Color 2"
            color={uiUniforms.color2}
            onChange={(v) => onUniformChange('color2', v)}
          />
          
          <ColorSwatch
            label="Color 3"
            color={uiUniforms.color3}
            onChange={(v) => onUniformChange('color3', v)}
          />
        </div>
      </div>
    </div>
  );
}

export default ShaderTab;
