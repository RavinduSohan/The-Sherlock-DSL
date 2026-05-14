'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXRendererProps {
  latex: string;
  position: [number, number];
  phase: string;
  currentPhase: string;
  id: string;
  displayMode?: boolean;
}

export default function LaTeXRenderer({ 
  latex, 
  position, 
  phase, 
  currentPhase, 
  id, 
  displayMode = true 
}: LaTeXRendererProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current && latex) {
      try {
        console.log(`🔧 Rendering LaTeX for ${id}:`, latex);
        
        katex.render(latex, elementRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: '#ff6b6b',
          macros: {
            '\\vec': '\\mathbf{#1}',
            '\\matrix': '\\begin{bmatrix}#1\\end{bmatrix}',
            '\\eigen': '\\lambda',
            '\\transpose': '^{\\mathrm{T}}',
          }
        });
        
        console.log(`✅ Successfully rendered LaTeX for ${id}`);
      } catch (error) {
        console.error(`❌ Failed to render LaTeX for ${id}:`, error);
        if (elementRef.current) {
          elementRef.current.textContent = latex;
        }
      }
    }
  }, [latex, id, displayMode]);

  // Only show if current phase matches equation phase
  const isVisible = phase === currentPhase;

  return (
    <div
      ref={elementRef}
      id={`latex-${id}`}
      style={{
        position: 'absolute',
        left: `${position[0]}px`,
        top: `${position[1]}px`,
        color: '#ffffff',
        fontSize: '18px',
        textShadow: '0 0 10px rgba(212, 175, 55, 0.8)',
        pointerEvents: 'none',
        zIndex: 10,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
}
