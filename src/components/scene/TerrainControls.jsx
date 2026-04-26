import React from 'react';
import { Slider } from '../ui/Slider';
import { Toggle } from '../ui/Toggle';
import { COLOR_PRESETS } from '../../lib/colorPresets';

export function TerrainControls({
  config,
  onChange,
  onRegenerate,
  onSetActive
}) {
  const handleSourceChange = (source) => {
    onChange({ ...config, source });
  };
  
  const handleColorPresetChange = (preset) => {
    onChange({ ...config, colorPreset: preset });
  };
  
  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Terrain</span>
      </div>
      <div className="section-content">
        {/* Source selector */}
        <div className="control-row">
          <span className="control-label">Source</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn btn-secondary ${config.source === 'perlin' ? 'active' : ''}`}
              onClick={() => handleSourceChange('perlin')}
              style={{
                padding: '4px 10px',
                fontSize: '10px',
                background: config.source === 'perlin' ? 'rgba(79, 255, 176, 0.2)' : undefined,
                borderColor: config.source === 'perlin' ? 'var(--accent)' : undefined
              }}
            >
              Perlin
            </button>
            <button
              className={`btn btn-secondary ${config.source === 'island' ? 'active' : ''}`}
              onClick={() => handleSourceChange('island')}
              style={{
                padding: '4px 10px',
                fontSize: '10px',
                background: config.source === 'island' ? 'rgba(79, 255, 176, 0.2)' : undefined,
                borderColor: config.source === 'island' ? 'var(--accent)' : undefined
              }}
            >
              Island
            </button>
          </div>
        </div>
        
        {/* Sliders */}
        <Slider
          label="Resolution"
          value={config.segments}
          min={20}
          max={200}
          step={10}
          onChange={(v) => onChange({ ...config, segments: v })}
        />
        
        <Slider
          label="Height Scale"
          value={config.heightScale}
          min={1}
          max={30}
          step={0.5}
          onChange={(v) => onChange({ ...config, heightScale: v })}
        />
        
        <Slider
          label="Noise Freq"
          value={config.noiseFreq}
          min={0.01}
          max={0.2}
          step={0.01}
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => onChange({ ...config, noiseFreq: v })}
        />
        
        <Slider
          label="Octaves"
          value={config.octaves}
          min={1}
          max={8}
          step={1}
          onChange={(v) => onChange({ ...config, octaves: v })}
        />
        
        {/* Color presets */}
        <div style={{ marginTop: '12px' }}>
          <span className="control-label" style={{ display: 'block', marginBottom: '8px' }}>
            Color Preset
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                className={`color-swatch ${config.colorPreset === key ? 'active' : ''}`}
                onClick={() => handleColorPresetChange(key)}
                style={{
                  padding: '4px 8px',
                  background: config.colorPreset === key ? 'rgba(79, 255, 176, 0.1)' : undefined
                }}
              >
                <div
                  className="color-preview"
                  style={{
                    background: `linear-gradient(to bottom, 
                      rgb(${preset.colors[0].color.map(c => Math.round(c * 255)).join(',')}), 
                      rgb(${preset.colors[preset.colors.length - 1].color.map(c => Math.round(c * 255)).join(',')})
                    )`
                  }}
                />
                <span className="color-label">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Wireframe toggle */}
        <div style={{ marginTop: '12px' }}>
          <Toggle
            label="Wireframe"
            checked={config.wireframe}
            onChange={(v) => onChange({ ...config, wireframe: v })}
          />
        </div>
        
        {/* Action buttons */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={onRegenerate}>
            Regenerate
          </button>
          <button className="btn btn-secondary" onClick={onSetActive}>
            Set Active
          </button>
        </div>
      </div>
    </div>
  );
}

export default TerrainControls;
