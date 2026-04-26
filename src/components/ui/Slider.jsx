import React from 'react';

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  showValue = true,
  formatValue = (v) => v,
  disabled = false
}) {
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };
  
  return (
    <div className="control-row">
      <span className="control-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          style={{ width: '100px' }}
        />
        {showValue && (
          <span className="control-value">{formatValue(value)}</span>
        )}
      </div>
    </div>
  );
}

export default Slider;
