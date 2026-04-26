import { useState } from 'react';

const STORAGE_KEY = 'shader-studio-welcomed';

const steps = [
  {
    icon: '🏔️',
    title: 'Terrain',
    description: 'Adjust sliders and color presets in the Scene tab, then click Regenerate to apply your changes to the 3D view.',
  },
  {
    icon: '🔷',
    title: 'Primitives',
    description: 'Pick a primitive shape from the Primitives section, then click Set Active to load it into the scene.',
  },
  {
    icon: '📦',
    title: 'Upload GLB',
    description: 'First activate a Terrain or Primitive, then drop your GLB file. It replaces the current scene object with your model.',
  },
  {
    icon: '⚡',
    title: 'Shader Editor — Important',
    description: 'Write or edit GLSL in the Shader tab. Nothing updates automatically — you must click Compile every single time you make a change.',
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem(STORAGE_KEY); }
    catch { return true; }
  });
  const [step, setStep] = useState(0);

  const handleClose = () => {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
    setOpen(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else handleClose();
  };

  if (!open) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'inherit',
    }}>
      <div style={{
        backgroundColor: '#111',
        border: '1px solid #2a2a2a',
        borderRadius: '14px',
        padding: '32px 28px 24px',
        maxWidth: '420px',
        width: 'calc(100% - 2rem)',
        color: 'white',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 6px' }}>
            Universal Shader Studio
          </h2>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
            Step {step + 1} of {steps.length} — quick guide before you dive in
          </p>
        </div>

        {/* Step content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          minHeight: '150px',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <span style={{ fontSize: '44px', lineHeight: 1 }}>{current.icon}</span>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>
            {current.title}
          </h3>
          <p style={{
            fontSize: '13px',
            color: '#888',
            lineHeight: '1.6',
            margin: 0,
            maxWidth: '320px',
          }}>
            {current.description}
          </p>
        </div>

        {/* Dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '24px',
        }}>
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                height: '6px',
                width: i === step ? '20px' : '6px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: i === step ? '#22c55e' : '#333',
                transition: 'all 0.2s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px',
            }}
            onMouseEnter={e => e.target.style.color = '#888'}
            onMouseLeave={e => e.target.style.color = '#555'}
          >
            Skip all
          </button>
          <button
            onClick={handleNext}
            style={{
              backgroundColor: '#22c55e',
              color: '#000',
              border: 'none',
              padding: '9px 22px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '100px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            {isLast ? "Let's Go 🚀" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;