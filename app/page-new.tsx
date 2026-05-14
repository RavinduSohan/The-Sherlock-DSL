'use client';

import { useState, useRef, useEffect } from 'react';
import { SherlockRuntime, createSherlockRuntime } from '@/lib/core/sherlockRuntime';
import { SherlockConfig } from '@/lib/core/sherlockParser';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Initialize runtime
  useEffect(() => {
    if (canvasRef.current && !runtimeRef.current) {
      const runtime = createSherlockRuntime(canvasRef.current);
      
      runtime.onPhaseChanged((phase) => {
        setCurrentPhase(phase.name);
        console.log('Phase changed to:', phase.name, phase);
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
          
          // Auto-load the first scene or basic_vector if available
          if (scenes.length > 0) {
            const defaultScene = scenes.includes('basic_vector') ? 'basic_vector' : scenes[0];
            loadPresetScene(defaultScene);
          }
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
        phases: phaseTimings
      });
      
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
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0d1117', 
      color: '#c9d1d9',
      display: 'flex'
    }}>
      {/* Left Panel - Controls and Info */}
      <div style={{
        width: '400px',
        padding: '20px',
        borderRight: '1px solid #30363d',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxHeight: '100vh',
        overflowY: 'auto'
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

            {/* Progress Bar */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7d8590', marginBottom: '5px' }}>
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
              
              <h4 style={{ margin: '10px 0 5px 0', fontSize: '14px' }}>Phases:</h4>
              {debugInfo.phases.map((phase: any, index: number) => (
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

      {/* Right Panel - Canvas */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: config?.background || '#0d1117'
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
            maxHeight: '100%'
          }}
        />
      </div>
    </div>
  );
}
