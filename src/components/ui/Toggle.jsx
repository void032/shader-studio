import React from 'react';

export function Toggle({
  label,
  checked,
  onChange,
  disabled = false
}) {
  return (
    <div className="control-row">
      <span className="control-label">{label}</span>
      <div
        className={`toggle ${checked ? 'active' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <div className="toggle-knob" />
      </div>
    </div>
  );
}

export default Toggle;
