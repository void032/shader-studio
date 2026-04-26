import React from 'react';
import { Slider } from '../ui/Slider';
import { PRIMITIVE_SHAPES } from '../../context/StudioContext';

const SHAPE_LABELS = {
  [PRIMITIVE_SHAPES.BOX]: 'Box',
  [PRIMITIVE_SHAPES.SPHERE]: 'Sphere',
  [PRIMITIVE_SHAPES.TORUS]: 'Torus',
  [PRIMITIVE_SHAPES.TORUS_KNOT]: 'TorusKnot',
  [PRIMITIVE_SHAPES.CYLINDER]: 'Cylinder',
  [PRIMITIVE_SHAPES.CONE]: 'Cone'
};

export function PrimitiveControls({
  config,
  onChange,
  onSetActive
}) {
  const handleShapeChange = (shape) => {
    onChange({ ...config, shape });
  };
  
  const renderShapeControls = () => {
    switch (config.shape) {
      case PRIMITIVE_SHAPES.BOX:
        return (
          <>
            <Slider
              label="Width"
              value={config.width}
              min={0.1}
              max={10}
              step={0.1}
              onChange={(v) => onChange({ ...config, width: v })}
            />
            <Slider
              label="Height"
              value={config.height}
              min={0.1}
              max={10}
              step={0.1}
              onChange={(v) => onChange({ ...config, height: v })}
            />
            <Slider
              label="Depth"
              value={config.depth}
              min={0.1}
              max={10}
              step={0.1}
              onChange={(v) => onChange({ ...config, depth: v })}
            />
          </>
        );
        
      case PRIMITIVE_SHAPES.SPHERE:
        return (
          <>
            <Slider
              label="Radius"
              value={config.radius}
              min={0.1}
              max={10}
              step={0.1}
              onChange={(v) => onChange({ ...config, radius: v })}
            />
            <Slider
              label="Width Segs"
              value={config.widthSegments}
              min={4}
              max={64}
              step={1}
              onChange={(v) => onChange({ ...config, widthSegments: v })}
            />
            <Slider
              label="Height Segs"
              value={config.heightSegments}
              min={4}
              max={64}
              step={1}
              onChange={(v) => onChange({ ...config, heightSegments: v })}
            />
          </>
        );
        
      case PRIMITIVE_SHAPES.TORUS:
        return (
          <>
            <Slider
              label="Radius"
              value={config.radius}
              min={0.5}
              max={8}
              step={0.1}
              onChange={(v) => onChange({ ...config, radius: v })}
            />
            <Slider
              label="Tube"
              value={config.tube}
              min={0.1}
              max={4}
              step={0.1}
              onChange={(v) => onChange({ ...config, tube: v })}
            />
            <Slider
              label="Radial Segs"
              value={config.radialSegments}
              min={4}
              max={64}
              step={1}
              onChange={(v) => onChange({ ...config, radialSegments: v })}
            />
            <Slider
              label="Tubular Segs"
              value={config.tubularSegments}
              min={8}
              max={128}
              step={1}
              onChange={(v) => onChange({ ...config, tubularSegments: v })}
            />
          </>
        );
        
      case PRIMITIVE_SHAPES.TORUS_KNOT:
        return (
          <>
            <Slider
              label="Radius"
              value={config.radius}
              min={0.5}
              max={8}
              step={0.1}
              onChange={(v) => onChange({ ...config, radius: v })}
            />
            <Slider
              label="Tube"
              value={config.tube}
              min={0.1}
              max={4}
              step={0.1}
              onChange={(v) => onChange({ ...config, tube: v })}
            />
            <Slider
              label="P"
              value={config.p}
              min={1}
              max={10}
              step={1}
              onChange={(v) => onChange({ ...config, p: v })}
            />
            <Slider
              label="Q"
              value={config.q}
              min={1}
              max={10}
              step={1}
              onChange={(v) => onChange({ ...config, q: v })}
            />
          </>
        );
        
      case PRIMITIVE_SHAPES.CYLINDER:
        return (
          <>
            <Slider
              label="Radius Top"
              value={config.radius}
              min={0.1}
              max={10}
              step={0.1}
              onChange={(v) => onChange({ ...config, radius: v })}
            />
            <Slider
              label="Height"
              value={config.height}
              min={0.1}
              max={20}
              step={0.1}
              onChange={(v) => onChange({ ...config, height: v })}
            />
            <Slider
              label="Segments"
              value={config.radialSegments}
              min={3}
              max={64}
              step={1}
              onChange={(v) => onChange({ ...config, radialSegments: v })}
            />
          </>
        );
        
      case PRIMITIVE_SHAPES.CONE:
        return (
          <>
            <Slider
              label="Radius"
              value={config.radius}
              min={0.1}
              max={10}
              step={0.1}
              onChange={(v) => onChange({ ...config, radius: v })}
            />
            <Slider
              label="Height"
              value={config.height}
              min={0.1}
              max={20}
              step={0.1}
              onChange={(v) => onChange({ ...config, height: v })}
            />
            <Slider
              label="Segments"
              value={config.radialSegments}
              min={3}
              max={64}
              step={1}
              onChange={(v) => onChange({ ...config, radialSegments: v })}
            />
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Primitives</span>
      </div>
      <div className="section-content">
        {/* Shape selector */}
        <div className="primitive-grid">
          {Object.values(PRIMITIVE_SHAPES).map((shape) => (
            <button
              key={shape}
              className={`primitive-btn ${config.shape === shape ? 'active' : ''}`}
              onClick={() => handleShapeChange(shape)}
            >
              {SHAPE_LABELS[shape]}
            </button>
          ))}
        </div>
        
        {/* Shape-specific controls */}
        {renderShapeControls()}
        
        {/* Set active button */}
        <div style={{ marginTop: '16px' }}>
          <button className="btn btn-secondary" onClick={onSetActive}>
            Set Active
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrimitiveControls;
