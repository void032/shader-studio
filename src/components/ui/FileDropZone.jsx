// src/components/ui/FileDropZone.jsx
import React, { useState, useRef } from 'react';

export function FileDropZone({
  onFileSelect,
  accept = '.glb',
  disabled = false
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const ext = accept.replace('.', '');
      if (!file.name.toLowerCase().endsWith(ext)) return;
      if (file.size > 25 * 1024 * 1024) return; // 100MB limit
      onFileSelect(file);
    }
  };
  
  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };
  
const handleFileInput = (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    const file = files[0];
    const ext = accept.replace('.', '');
    if (!file.name.toLowerCase().endsWith(ext)) return;
    if (file.size > 25 * 1024 * 1024) return; // 100MB limit
    onFileSelect(file);
  }
};
  
  return (
    <div
      className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      <div className="drop-zone-text">
        Drop {accept} file here or click to browse
      </div>
      <div className="drop-zone-hint">
        Supports: {accept}
      </div>
    </div>
  );
}

export default FileDropZone;
