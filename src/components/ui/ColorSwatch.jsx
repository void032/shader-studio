import React from 'react';

export function ColorSwatch({
  label,
  color,
  onChange,
  disabled = false
}) {
  return (
    <div className="control-row">
      <span className="control-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <span className="control-value" style={{ textTransform: 'uppercase' }}>
          {color}
        </span>
      </div>
    </div>
  );
}

export default ColorSwatch;
