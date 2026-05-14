'use client';

import { useState, useRef, useEffect } from 'react';
import { SherlockRuntime, createSherlockRuntime, RuntimePhase } from '@/lib/core/sherlockRuntime';
import { SherlockConfig } from '@/lib/core/sherlockParser';
import { KaTeXRenderer } from '@/lib/core/katexRenderer';
import 'katex/dist/katex.min.css';

export default function SceneCompilerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const equationOverlayRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<SherlockRuntime | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sceneContent, setSceneContent] = useState<string>('');
  const [config, setConfig] = useState<SherlockConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [availableScenes, setAvailableScenes] = useState<string[]>([]);
  const [selectedScene, setSelectedScene] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<{
    totalDuration: number;
    phaseCount: number;
    actualDuration: number;
    timingBuffer: number;
    equationCount: number;
    hasEquations: boolean;
    phases: Array<{
      name: string;
      duration: number;
      startTime: number;
      endTime: number;
      elementCount: number;
      elements: string[];
    }>;
  } | null>(null);
  const [equationErrors, setEquationErrors] = useState<string[]>([]);
  const [latexValidation, setLatexValidation] = useState<{[key: string]: boolean}>({});
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);

  // Helper function to validate LaTeX equations using the compiler route
  const validateEquations = async (equations: any[]) => {
    const validationResults: {[key: string]: boolean} = {};
    const errors: string[] = [];
    
    for (const equation of equations) {
      try {
        const response = await fetch('/api/compiler/latex', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            latex: equation.latex,
            options: { displayMode: true }
          })
        });
        
        const result = await response.json();
        if (result.success) {
          validationResults[equation.id] = true;
          console.log('✅ Equation validated:', equation.id);
        } else {
          validationResults[equation.id] = false;
          errors.push(`${equation.id}: ${result.error}`);
          console.error('❌ Equation validation failed:', equation.id, result.error);
        }
      } catch (err) {
        validationResults[equation.id] = false;
        errors.push(`${equation.id}: Network error`);
        console.error('❌ Equation validation error:', equation.id, err);
      }
    }
    
    setLatexValidation(validationResults);
    setEquationErrors(errors);
    return validationResults;
  };

  // Helper function to handle equations for phase changes
  const handlePhaseEquations = (phase: RuntimePhase) => {
    // The runtime already handles equation rendering in its renderEquations method
    // This is called automatically by the runtime's phase change handler
    console.log('Phase equations handled for:', phase.name);
  };

  // Helper function to clear equations when loading new scenes
  const clearEquations = () => {
    // The runtime handles equation clearing internally when loading new scenes
    setEquationErrors([]);
    setLatexValidation({});
    console.log('Clearing equations for new scene');
  };

  // Initialize runtime
  useEffect(() => {
    if (canvasRef.current && !runtimeRef.current) {
      const runtime = createSherlockRuntime(canvasRef.current);
      
      runtime.onPhaseChanged((phase) => {
        setCurrentPhase(phase.name);
        console.log('Phase changed to:', phase.name, phase);
        
        // Handle equations for the current phase
        handlePhaseEquations(phase);
      });
      
      runtime.onAnimationComplete(() => {
        setIsPlaying(false);
        console.log('Animation completed');
      });
      
      runtime.onProgressUpdate((progressValue) => {
        setProgress(progressValue);
      });
      
      runtimeRef.current = runtime;
    }
  }, []);

  // Load available scenes
  useEffect(() => {
    const loadScenes = async () => {
      try {
        const response = await fetch('/api/scenes');
        if (response.ok) {
          const scenes = await response.json();
          setAvailableScenes(scenes);
        }
      } catch (err) {
        console.warn('Could not load scene list:', err);
      }
    };
    loadScenes();
  }, []);

  const loadSceneContent = async (content: string) => {
    if (!runtimeRef.current) return;
    
    setError(null);
    setSceneContent(content);
    
    // Clear equations from previous scene
    clearEquations();
    
    try {
      await runtimeRef.current.loadFromContent(content);
      const loadedConfig = runtimeRef.current.getConfig();
      if (!loadedConfig) {
        throw new Error('Failed to get configuration from runtime');
      }
      setConfig(loadedConfig);
      
      // Generate debug info
      const phases = Object.entries(loadedConfig.phases);
      let cumulativeTime = 0;
      const phaseTimings = phases.map(([name, phase]) => {
        const start = cumulativeTime;
        const end = cumulativeTime + phase.duration;
        cumulativeTime = end;
        return {
          name,
          duration: phase.duration,
          startTime: start,
          endTime: end,
          elementCount: Object.keys(phase.elements).length,
          elements: Object.keys(phase.elements)
        };
      });
      
      setDebugInfo({
        totalDuration: loadedConfig.total_duration,
        phaseCount: phases.length,
        actualDuration: cumulativeTime,
        timingBuffer: loadedConfig.total_duration - cumulativeTime,
        phases: phaseTimings,
        equationCount: loadedConfig.equations?.length || 0,
        hasEquations: (loadedConfig.equations?.length || 0) > 0
      });
      
      // Validate equations if present
      if (loadedConfig.equations && loadedConfig.equations.length > 0) {
        console.log('🧮 Validating equations...');
        await validateEquations(loadedConfig.equations);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Scene loading error:', err);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        loadSceneContent(content);
      };
      reader.readAsText(file);
    }
  };

  const loadPresetScene = async (sceneName: string) => {
    try {
      setSelectedScene(sceneName);
      const response = await fetch(`/api/scenes/${sceneName}`);
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          loadSceneContent(data.content);
        }
      }
    } catch (err) {
      setError(`Failed to load scene: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePlay = () => {
    if (runtimeRef.current && config) {
      runtimeRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (runtimeRef.current) {
      runtimeRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (runtimeRef.current) {
      runtimeRef.current.stop();
      setIsPlaying(false);
      setProgress(0);
      setCurrentPhase('');
      // Clear equations when stopping
      clearEquations();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Test equation rendering directly
  const testEquationRendering = async () => {
    if (!runtimeRef.current || !config?.equations) return;
    
    try {
      console.log('🧪 Testing equation rendering...');
      console.log('📊 Available equations:', config.equations);
      
      // Force render equations for current phase
      const runtime = runtimeRef.current as any;
      
      if (runtime.equationOverlay && config.equations.length > 0) {
        // Test all equations, not just the first one
        for (let i = 0; i < config.equations.length; i++) {
          const testEquation = config.equations[i];
          console.log(`🧪 Testing equation ${i + 1}:`, testEquation);
          
          // Create test element with unique positioning
          const testElement = document.createElement('div');
          testElement.style.cssText = `
            position: absolute;
            top: ${50 + i * 80}px;
            left: 50px;
            background: rgba(0,0,0,0.9);
            padding: 12px 16px;
            border: 2px solid #00ff00;
            border-radius: 8px;
            z-index: 2000;
            color: white;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
          `;
          
          // Add equation ID as a label
          const labelElement = document.createElement('div');
          labelElement.textContent = `ID: ${testEquation.id} | Phase: ${testEquation.phase}`;
          labelElement.style.cssText = `
            font-size: 12px;
            color: #00ff00;
            margin-bottom: 5px;
            font-family: monospace;
          `;
          testElement.appendChild(labelElement);
          
          // Render equation
          const equationDiv = document.createElement('div');
          KaTeXRenderer.renderToElement(testEquation.latex, equationDiv);
          testElement.appendChild(equationDiv);
          
          runtime.equationOverlay.appendChild(testElement);
          
          // Remove after 5 seconds with animation
          setTimeout(() => {
            testElement.style.transition = 'opacity 0.5s ease-out';
            testElement.style.opacity = '0';
            setTimeout(() => testElement.remove(), 500);
          }, 5000);
        }
        
        console.log('✅ All equations tested successfully');
      } else {
        console.warn('⚠️ No equation overlay or equations found');
      }
    } catch (err) {
      console.error('❌ Test equation rendering failed:', err);
    }
  };

  // Force render all equations regardless of phase
  const forceRenderAllEquations = async () => {
    if (!runtimeRef.current || !config?.equations) return;
    
    try {
      console.log('🚨 Force rendering all equations...');
      const runtime = runtimeRef.current as any;
      
      // Use the public method if available
      if (runtime.forceRenderAllEquations) {
        runtime.forceRenderAllEquations();
        console.log('✅ All equations force rendered via public method');
      } else {
        console.warn('⚠️ Public method not available');
      }
    } catch (err) {
      console.error('❌ Force render failed:', err);
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    console.log('Toggling sidebar. Current state:', sidebarVisible, '-> New state:', !sidebarVisible);
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0d1117', 
      color: '#c9d1d9',
      display: 'flex'
    }}>
      {/* Toggle Button - Fixed Position */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: sidebarVisible ? '400px' : '0px',
          zIndex: 999999,
          transform: 'translateY(-50%)',
          transition: 'left 0.3s ease'
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{
            padding: '15px 6px',
            backgroundColor: '#2d2416',
            color: '#d4af37',
            border: '1px solid #3d3426',
            borderRadius: sidebarVisible ? '0 8px 8px 0' : '0 8px 8px 0',
            borderLeft: sidebarVisible ? 'none' : '1px solid #3d3426',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '2px 0 6px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '30px',
            minHeight: '60px',
            textAlign: 'center',
            userSelect: 'none',
            outline: 'none',
            transition: 'all 0.3s ease',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            opacity: 0.7
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.opacity = '1';
            target.style.backgroundColor = '#3d3426';
            target.style.color = '#f4d03f';
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.opacity = '0.7';
            target.style.backgroundColor = '#2d2416';
            target.style.color = '#d4af37';
          }}
          title={sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          {sidebarVisible ? '《' : '》'}
        </button>
      </div>

      {/* Alternative Top Toggle Button */}
      <div
        style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999998
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2d2416',
            color: '#d4af37',
            border: '1px solid #3d3426',
            borderRadius: '15px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
            display: 'block',
            textAlign: 'center',
            userSelect: 'none',
            outline: 'none',
            transition: 'all 0.3s ease',
            opacity: 0.6
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.opacity = '1';
            target.style.backgroundColor = '#3d3426';
            target.style.color = '#f4d03f';
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.opacity = '0.6';
            target.style.backgroundColor = '#2d2416';
            target.style.color = '#d4af37';
          }}
        >
          {sidebarVisible ? '❮ hide ❮' : '❯ show ❯'}
        </button>
      </div>

      {/* Emergency Toggle - Bottom Right */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 999997
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#2d2416',
            color: '#d4af37',
            border: '1px solid #3d3426',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            outline: 'none',
            transition: 'all 0.3s ease',
            opacity: 0.6
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.opacity = '1';
            target.style.backgroundColor = '#3d3426';
            target.style.color = '#f4d03f';
            target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.opacity = '0.6';
            target.style.backgroundColor = '#2d2416';
            target.style.color = '#d4af37';
            target.style.transform = 'scale(1)';
          }}
          title="Toggle Sidebar"
        >
          {sidebarVisible ? '◀' : '▶'}
        </button>
      </div>

      {/* Left Panel - Controls and Info */}
      {sidebarVisible && (
        <div style={{
          width: '400px',
          padding: '20px',
          borderRight: '1px solid #30363d',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '100vh',
          overflowY: 'auto',
          transition: 'width 0.3s ease'
        }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          margin: '0 0 20px 0',
          color: '#58a6ff'
        }}>
          🕵️ Sherlock Scene Compiler
        </h1>

        {/* Scene Selection */}
        <div>
          <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Load Scene</h3>
          
          {/* Preset Scenes */}
          {availableScenes.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', color: '#7d8590', display: 'block', marginBottom: '5px' }}>
                Preset Scenes:
              </label>
              <select
                value={selectedScene}
                onChange={(e) => loadPresetScene(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  color: '#c9d1d9',
                  fontSize: '14px'
                }}
              >
                <option value="">Select a scene...</option>
                {availableScenes.map(scene => (
                  <option key={scene} value={scene}>{scene}</option>
                ))}
              </select>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label style={{ fontSize: '14px', color: '#7d8590', display: 'block', marginBottom: '5px' }}>
              Upload .sherlock file:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sherlock"
              onChange={handleFileUpload}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#21262d',
                border: '1px solid #30363d',
                borderRadius: '6px',
                color: '#c9d1d9',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Controls */}
        {config && (
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Controls</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isPlaying ? '#30363d' : '#238636',
                  color: isPlaying ? '#7d8590' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                ▶ Play
              </button>
              
              <button
                onClick={handlePause}
                disabled={!isPlaying}
                style={{
                  padding: '8px 16px',
                  backgroundColor: !isPlaying ? '#30363d' : '#da3633',
                  color: !isPlaying ? '#7d8590' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !isPlaying ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                ⏸ Pause
              </button>
              
              <button
                onClick={handleStop}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6f42c1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ⏹ Stop
              </button>
            </div>

            {/* Test Equation Button */}
            {config?.equations && config.equations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                <button
                  onClick={testEquationRendering}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: '#f39c12',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🧪 Test Equation Rendering
                </button>
                <button
                  onClick={forceRenderAllEquations}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: '#e74c3c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🚨 Force Show All Equations
                </button>
              </div>
            )}

            {/* Progress Bar */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', fontSize: '12px', color: '#7d8590', marginBottom: '5px' }}>
                <span>Progress: {Math.round(progress * 100)}%</span>
                <span>{formatTime(progress * config.total_duration)} / {formatTime(config.total_duration)}</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#21262d',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  backgroundColor: '#58a6ff',
                  transition: 'width 0.1s ease'
                }} />
              </div>
            </div>

            {/* Current Phase */}
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#21262d', 
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <strong>Current Phase:</strong> {currentPhase || 'None'}
            </div>
          </div>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Debug Info</h3>
            <div style={{ 
              fontSize: '12px', 
              backgroundColor: '#161b22', 
              padding: '10px', 
              borderRadius: '6px',
              fontFamily: 'monospace'
            }}>
              <div><strong>Total Duration:</strong> {debugInfo.totalDuration}s</div>
              <div><strong>Actual Duration:</strong> {debugInfo.actualDuration}s</div>
              <div><strong>Timing Buffer:</strong> {debugInfo.timingBuffer}s</div>
              <div><strong>Phase Count:</strong> {debugInfo.phaseCount}</div>
              <div><strong>Equations:</strong> {debugInfo.equationCount} {debugInfo.hasEquations ? '✅' : '❌'}</div>
              
              {/* Equation Validation Status */}
              {debugInfo.hasEquations && (
                <div style={{ marginTop: '10px' }}>
                  <h5 style={{ margin: '5px 0', fontSize: '12px' }}>Equation Validation:</h5>
                  {Object.entries(latexValidation).map(([id, isValid]) => (
                    <div key={id} style={{ fontSize: '11px', color: isValid ? '#7dd3fc' : '#fca5a5' }}>
                      {isValid ? '✅' : '❌'} {id}
                    </div>
                  ))}
                  
                  {equationErrors.length > 0 && (
                    <div style={{ marginTop: '5px' }}>
                      <h6 style={{ margin: '5px 0', fontSize: '11px', color: '#fca5a5' }}>Errors:</h6>
                      {equationErrors.map((error, index) => (
                        <div key={index} style={{ fontSize: '10px', color: '#fca5a5' }}>
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <h4 style={{ margin: '10px 0 5px 0', fontSize: '14px' }}>Phases:</h4>
              {debugInfo.phases.map((phase, index: number) => (
                <div key={index} style={{ 
                  marginBottom: '8px', 
                  padding: '6px', 
                  backgroundColor: '#0d1117', 
                  borderRadius: '4px',
                  borderLeft: '3px solid #58a6ff'
                }}>
                  <div><strong>{phase.name}</strong></div>
                  <div>⏱️ {phase.startTime}s - {phase.endTime}s ({phase.duration}s)</div>
                  <div>📦 {phase.elementCount} elements: {phase.elements.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f85149',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Scene Content */}
        {sceneContent && (
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Scene Source</h3>
            <textarea
              value={sceneContent}
              onChange={(e) => setSceneContent(e.target.value)}
              style={{
                width: '100%',
                height: '300px',
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                color: '#c9d1d9',
                fontSize: '12px',
                fontFamily: 'monospace',
                padding: '10px',
                resize: 'vertical'
              }}
            />
            <button
              onClick={() => loadSceneContent(sceneContent)}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#0969da',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reload Scene
            </button>
          </div>
        )}
        </div>
      )}

      {/* Right Panel - Canvas */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: config?.background || '#0d1117',
        paddingLeft: sidebarVisible ? '20px' : '60px', // Extra left padding when sidebar is hidden to account for toggle button
        transition: 'padding-left 0.3s ease'
      }}>
        <div style={{ 
          position: 'relative',
          display: 'inline-block'
        }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{
              border: '1px solid #30363d',
              borderRadius: '8px',
              backgroundColor: config?.background || '#000000',
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block'
            }}
          />
          {/* Hidden overlay ref for potential future use */}
          <div
            ref={equationOverlayRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 1000,
              display: 'none' // Hidden since runtime creates its own
            }}
          />
        </div>
      </div>
    </div>
  );
}
