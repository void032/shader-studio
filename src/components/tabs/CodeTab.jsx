import React, { useState, useCallback } from 'react';
import { CodeBlock } from '../ui/CodeBlock';
import { useStudio } from '../../context/StudioContext';
import { useCodeExport } from '../../hooks/useCodeExport';

const FORMATS = ['threejs', 'r3f', 'glsl', 'vanilla'];

export function CodeTab({
  vertSrc,
  fragSrc,
  uniforms,
  presetCategory
}) {
  const [activeFormat, setActiveFormat] = useState('threejs');
  const [copied, setCopied] = useState(false);
  const { showToast } = useStudio();
  const { generateCode, downloadCode, copyToClipboard, getFormatLabel, getFormatDescription } = useCodeExport();
  
  // Generate code for current format
  const code = generateCode(activeFormat, vertSrc, fragSrc, uniforms, presetCategory);
  
  // Handle copy
  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(activeFormat, vertSrc, fragSrc, uniforms, presetCategory);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      showToast('Copied to clipboard');
    }
    return success;
  }, [activeFormat, vertSrc, fragSrc, uniforms, presetCategory, copyToClipboard, showToast]);
  
  // Handle download
  const handleDownload = useCallback(() => {
    downloadCode(activeFormat, vertSrc, fragSrc, uniforms, presetCategory);
    showToast('Download started');
  }, [activeFormat, vertSrc, fragSrc, uniforms, presetCategory, downloadCode, showToast]);
  
  // Get code content based on format
  const getCodeContent = () => {
    if (activeFormat === 'glsl') {
      return `// Vertex Shader\n\n${code.vertex}\n\n// Fragment Shader\n\n${code.fragment}`;
    }
    return code;
  };
  
  // Get title based on format
  const getTitle = () => {
    if (activeFormat === 'glsl') {
      return 'GLSL Shaders';
    }
    return `${getFormatLabel(activeFormat)} Code`;
  };
  
  return (
    <div className="tab-content">
      {/* Format Tabs */}
      <div className="format-tabs">
        {FORMATS.map((format) => (
          <button
            key={format}
            className={`format-tab ${activeFormat === format ? 'active' : ''}`}
            onClick={() => setActiveFormat(format)}
          >
            {getFormatLabel(format)}
          </button>
        ))}
      </div>
      
      {/* Format Description */}
      <div style={{ 
        marginBottom: '16px',
        padding: '10px 12px',
        background: 'rgba(56, 189, 248, 0.05)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        color: 'var(--text-dim)',
        lineHeight: 1.6
      }}>
        {getFormatDescription(activeFormat)}
      </div>
      
      {/* Code Block */}
      <CodeBlock
        code={getCodeContent()}
        language={activeFormat === 'glsl' ? 'glsl' : 'javascript'}
        title={getTitle()}
        onCopy={handleCopy}
        onDownload={handleDownload}
      />
      
      {/* Uniform Info */}
      <div style={{ 
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        color: 'var(--text-dim)'
      }}>
        <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
          Active Uniforms
        </strong>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', lineHeight: 1.8 }}>
          {uniforms.u_time && (
            <div>u_time: <span style={{ color: 'var(--gold)' }}>auto-updated</span></div>
          )}
          {uniforms.u_timeScale && (
            <div>u_timeScale: <span style={{ color: 'var(--gold)' }}>{uniforms.u_timeScale.value}</span></div>
          )}
          {uniforms.u_warp && (
            <div>u_warp: <span style={{ color: 'var(--gold)' }}>{uniforms.u_warp.value}</span></div>
          )}
          {uniforms.u_brightness && (
            <div>u_brightness: <span style={{ color: 'var(--gold)' }}>{uniforms.u_brightness.value}</span></div>
          )}
          {uniforms.u_steps && (
            <div>u_steps: <span style={{ color: 'var(--gold)' }}>{uniforms.u_steps.value}</span></div>
          )}
          {uniforms.u_threshold && (
            <div>u_threshold: <span style={{ color: 'var(--gold)' }}>{uniforms.u_threshold.value}</span></div>
          )}
          {uniforms.u_freq && (
            <div>u_freq: <span style={{ color: 'var(--gold)' }}>{uniforms.u_freq.value}</span></div>
          )}
          {uniforms.u_color1 && (
            <div>u_color1: <span style={{ color: 'var(--gold)' }}>#{uniforms.u_color1.value.getHexString()}</span></div>
          )}
          {uniforms.u_color2 && (
            <div>u_color2: <span style={{ color: 'var(--gold)' }}>#{uniforms.u_color2.value.getHexString()}</span></div>
          )}
          {uniforms.u_color3 && (
            <div>u_color3: <span style={{ color: 'var(--gold)' }}>#{uniforms.u_color3.value.getHexString()}</span></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeTab;
