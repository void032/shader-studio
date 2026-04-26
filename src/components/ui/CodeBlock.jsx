//CodeBlock.jsx
import React, { useState, useMemo } from 'react';

// Simple syntax highlighter for GLSL and JavaScript
function highlightSyntax(code, language) {
  const keywords = [
    'uniform', 'varying', 'attribute', 'void', 'float', 'vec2', 'vec3', 'vec4',
    'mat3', 'mat4', 'int', 'bool', 'const', 'if', 'else', 'for', 'while',
    'return', 'break', 'continue', 'struct', 'in', 'out', 'inout',
    'import', 'export', 'const', 'let', 'var', 'function', 'class',
    'extends', 'from', 'default', 'async', 'await', 'try', 'catch',
    'new', 'this', 'typeof', 'instanceof'
  ];
  
  const builtins = [
    'gl_Position', 'gl_FragColor', 'gl_FragCoord', 'gl_PointCoord',
    'texture2D', 'texture', 'normalize', 'dot', 'cross', 'mix', 'clamp',
    'pow', 'sin', 'cos', 'tan', 'length', 'distance', 'reflect', 'refract',
    'smoothstep', 'step', 'abs', 'floor', 'ceil', 'fract', 'mod', 'max', 'min',
    'sqrt', 'exp', 'log', 'sign', 'radians', 'degrees', 'atan',
    'useMemo', 'useRef', 'useState', 'useCallback', 'useEffect', 'useFrame'
  ];
  
  const types = [
    'THREE', 'Color', 'Vector2', 'Vector3', 'ShaderMaterial',
    'Mesh', 'Geometry', 'BufferGeometry', 'Scene', 'Camera', 'WebGLRenderer'
  ];
  
  // Escape HTML
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Tokenize and highlight
  const tokens = [];
  const regex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+\.?\d*\b|\b[a-zA-Z_]\w*\b|[{}();,=[\]+\-*\/<>!&|])/g;
  
  let match;
  let lastIndex = 0;
  
  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: html.slice(lastIndex, match.index) });
    }
    
    const token = match[0];
    
    if (token.startsWith('//') || token.startsWith('/*')) {
      tokens.push({ type: 'comment', value: token });
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      tokens.push({ type: 'string', value: token });
    } else if (/^\d/.test(token)) {
      tokens.push({ type: 'number', value: token });
    } else if (keywords.includes(token)) {
      tokens.push({ type: 'keyword', value: token });
    } else if (builtins.includes(token)) {
      tokens.push({ type: 'builtin', value: token });
    } else if (types.includes(token)) {
      tokens.push({ type: 'type', value: token });
    } else {
      tokens.push({ type: 'text', value: token });
    }
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < html.length) {
    tokens.push({ type: 'text', value: html.slice(lastIndex) });
  }
  
  return tokens.map((token, i) => {
    const className = `syntax-${token.type}`;
    return `<span class="${className}">${token.value}</span>`;
  }).join('');
}

export function CodeBlock({
  code,
  language = 'glsl',
  title,
  onCopy,
  onDownload
}) {
  const [copied, setCopied] = useState(false);
  
  const highlightedCode = useMemo(() => {
    return highlightSyntax(code, language);
  }, [code, language]);
  
  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  
  // Generate line numbers
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
  
  return (
    <div className="code-block">
      {(title || onCopy || onDownload) && (
        <div className="code-header">
          {title && <span className="code-title">{title}</span>}
          <div className="code-actions">
            {onCopy && (
              <button className="code-btn" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
            {onDownload && (
              <button className="code-btn" onClick={onDownload}>
                Download
              </button>
            )}
          </div>
        </div>
      )}
      <div className="editor-wrapper">
        <div className="line-numbers">{lineNumbers}</div>
        <pre
          className="code-content"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>
    </div>
  );
}

export default CodeBlock;
