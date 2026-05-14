'use client';

import { useEffect, useRef, useState } from 'react';
import { createSherlockRuntime } from '@/lib/core/sherlockRuntime';
import { KaTeXRenderer } from '@/lib/core/katexRenderer';

export default function AnimatedMathDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [runtime, setRuntime] = useState<any>(null);
  const [status, setStatus] = useState('Ready to load scene');
  const [description, setDescription] = useState('This demo shows animated matrix mathematics with KaTeX rendering and dynamic highlighting.');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const rt = createSherlockRuntime(canvasRef.current);
      setRuntime(rt);
      
      // Set up callbacks
      rt.onPhaseChanged((phase: any) => {
        setStatus(`Phase: ${phase.name} (${Math.round(phase.phaseProgress * 100)}%)`);
        setDescription(phase.data.description);
      });
      
      rt.onAnimationComplete(() => {
        setStatus('Animation completed!');
        setIsPlaying(false);
      });
    }
  }, []);

  const sceneContent = `concept: "Animated Matrix Mathematics"
emoji: "🧮"
total_duration: 15
background: "#0f0f23"
autoplay: true
loop: false

subtitles:
  - "🧮 Animated Matrix Mathematics"
  - "🔢 Step-by-Step Calculations"
  - "✨ KaTeX Highlighting"
  - "🎯 Interactive Learning"

equations:
  - id: "matrix_intro"
    latex: "\\\\text{Matrix Multiplication: } A \\\\times B = C"
    position: [50, 50]
    phase: "introduction"
  - id: "matrices_display"
    latex: "A = \\\\begin{bmatrix} 2 & 3 \\\\\\\\ 1 & 4 \\\\end{bmatrix}, \\\\quad B = \\\\begin{bmatrix} 5 & 1 \\\\\\\\ 2 & 3 \\\\end{bmatrix}"
    position: [50, 120]
    phase: "setup"

phases:
  introduction:
    duration: 3
    description: "Introduction to animated matrix math"
    elements:
      title_text:
        type: text
        content: "Animated Matrix Mathematics with KaTeX"
        position: [400, 100]
        color: "#d4af37"
        size: 28
        glow: true

  setup:
    duration: 4
    description: "Display matrices A and B"
    elements:
      matrix_a:
        type: matrix
        position: [150, 200]
        values: [[2, 3], [1, 4]]
        color: "#ff6b6b"
        label: "A"
      matrix_b:
        type: matrix
        position: [400, 200]
        values: [[5, 1], [2, 3]]
        color: "#4ecdc4"
        label: "B"

  calculation:
    duration: 6
    description: "Perform matrix multiplication"
    elements:
      matrix_a:
        type: matrix
        position: [150, 200]
        values: [[2, 3], [1, 4]]
        color: "#ff6b6b"
        label: "A"
      matrix_b:
        type: matrix
        position: [400, 200]
        values: [[5, 1], [2, 3]]
        color: "#4ecdc4"
        label: "B"
      result_matrix:
        type: matrix
        position: [600, 200]
        values: [[16, 11], [13, 13]]
        color: "#ffd93d"
        label: "C"

  final:
    duration: 2
    description: "Show final result"
    elements:
      result_matrix:
        type: matrix
        position: [400, 200]
        values: [[16, 11], [13, 13]]
        color: "#ffd93d"
        label: "Result"
        glow: true
`;

  const loadScene = async () => {
    if (!runtime) return;
    
    try {
      setStatus('Loading scene...');
      await runtime.loadFromContent(sceneContent);
      setStatus('Scene loaded successfully!');
      setDescription('Use Play to start the animation, or test the individual animation functions.');
      setIsLoaded(true);
    } catch (error: any) {
      setStatus('Error loading scene: ' + error.message);
      console.error('Scene loading error:', error);
    }
  };

  const playAnimation = () => {
    if (!runtime || !isLoaded) return;
    runtime.play();
    setStatus('Playing animation...');
    setIsPlaying(true);
  };

  const pauseAnimation = () => {
    if (!runtime) return;
    runtime.pause();
    setStatus('Animation paused');
    setIsPlaying(false);
  };

  const stopAnimation = () => {
    if (!runtime) return;
    runtime.stop();
    setStatus('Animation stopped');
    setIsPlaying(false);
  };

  const testMatrixAnimation = () => {
    if (!runtime) return;
    
    setStatus('Testing matrix multiplication animation...');
    
    // Create animated matrix multiplication
    runtime.createAnimatedMatrixMultiplication(
      'test_matrix',
      [[2, 3], [1, 4]],
      [[5, 1], [2, 3]],
      'center'
    );
    
    // Animate through steps
    setTimeout(() => runtime.animateMatrixMultiplicationStep('test_matrix', 0, 0, 0), 500);
    setTimeout(() => runtime.animateMatrixMultiplicationStep('test_matrix', 0, 0, 1), 1000);
    setTimeout(() => runtime.animateMatrixMultiplicationStep('test_matrix', 0, 0, 2), 1500);
    setTimeout(() => runtime.animateMatrixMultiplicationStep('test_matrix', 0, 0, 3), 2000);
    setTimeout(() => runtime.showMatrixMultiplicationResult('test_matrix', [[16, 11], [13, 13]]), 2500);
    
    setTimeout(() => {
      setStatus('Matrix animation complete!');
      runtime.clearAnimatedMath('test_matrix');
    }, 4000);
  };

  const testEquationAnimation = () => {
    if (!runtime) return;
    
    setStatus('Testing equation animation...');
    
    const steps = [
      {
        latex: "\\\\text{Starting equation: } ax^2 + bx + c = 0",
        duration: 2
      },
      {
        latex: "\\\\text{Apply quadratic formula: } x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}",
        highlightElements: ['.katex .mfrac'],
        duration: 3
      },
      {
        latex: "\\\\text{With } a=1, b=-5, c=6: x = \\\\frac{5 \\\\pm \\\\sqrt{25 - 24}}{2}",
        highlightElements: ['.katex .mord'],
        duration: 3
      },
      {
        latex: "\\\\text{Simplified: } x = \\\\frac{5 \\\\pm 1}{2} = 3 \\\\text{ or } 2",
        duration: 2
      }
    ];
    
    runtime.createAnimatedEquationSolving('test_equation', steps, 'center');
    
    // Step through the equation
    steps.forEach((step, index) => {
      setTimeout(() => {
        runtime.advanceEquationStep('test_equation', index);
      }, index * 1000);
    });
    
    setTimeout(() => {
      setStatus('Equation animation complete!');
      runtime.clearAnimatedMath('test_equation');
    }, steps.length * 1000 + 1000);
  };

  return (
    <div className="w-full h-screen bg-[#0f0f23] text-white overflow-hidden relative">
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-10"
        width={1920}
        height={1080}
      />
      
      {/* Controls */}
      <div className="absolute top-5 left-5 z-50 bg-black/80 p-4 rounded-lg border border-gray-600">
        <h3 className="text-xl font-bold mb-3">🧮 Animated Matrix Math Demo</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadScene}
            disabled={isLoaded}
            className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold px-4 py-2 rounded"
          >
            Load Scene
          </button>
          <button
            onClick={playAnimation}
            disabled={!isLoaded || isPlaying}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold px-4 py-2 rounded"
          >
            Play
          </button>
          <button
            onClick={pauseAnimation}
            disabled={!isLoaded || !isPlaying}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold px-4 py-2 rounded"
          >
            Pause
          </button>
          <button
            onClick={stopAnimation}
            disabled={!isLoaded}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold px-4 py-2 rounded"
          >
            Stop
          </button>
          <button
            onClick={testMatrixAnimation}
            disabled={!isLoaded}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold px-4 py-2 rounded"
          >
            Test Matrix
          </button>
          <button
            onClick={testEquationAnimation}
            disabled={!isLoaded}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold px-4 py-2 rounded"
          >
            Test Equation
          </button>
        </div>
      </div>
      
      {/* Status Info */}
      <div className="absolute bottom-5 left-5 right-5 bg-black/80 p-4 rounded-lg border border-gray-600 text-center z-50">
        <div className="text-yellow-400 font-bold mb-2">{status}</div>
        <div className="text-gray-300">{description}</div>
      </div>
    </div>
  );
}
