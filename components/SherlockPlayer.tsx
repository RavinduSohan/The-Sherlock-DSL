'use client';

import { useEffect, useRef, useState } from 'react';
import { SherlockRuntime, createSherlockRuntime } from '@/lib/core/sherlockRuntime';
import { SherlockConfig } from '@/lib/core/sherlockParser';

interface SherlockPlayerProps {
  sceneContent?: string;
  sceneUrl?: string;
  width?: number;
  height?: number;
  className?: string;
  onPhaseChange?: (phaseName: string) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function SherlockPlayer({
  sceneContent,
  sceneUrl,
  width = 800,
  height = 600,
  className = '',
  onPhaseChange,
  onComplete,
  onError
}: SherlockPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<SherlockRuntime | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [config, setConfig] = useState<SherlockConfig | null>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  // Handle responsive sizing for full-screen mode
  useEffect(() => {
    const updateDimensions = () => {
      if (width === window.innerWidth && height === window.innerHeight) {
        // Full-screen mode - minimal controls at corner
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      } else {
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  // Initialize runtime when canvas is ready
  useEffect(() => {
    if (canvasRef.current && !runtimeRef.current) {
      const runtime = createSherlockRuntime(canvasRef.current);
      
      // Set up event handlers
      runtime.onPhaseChanged((phase) => {
        setCurrentPhase(phase.name);
        onPhaseChange?.(phase.name);
      });
      
      runtime.onAnimationComplete(() => {
        setIsPlaying(false);
        onComplete?.();
      });
      
      runtime.onProgressUpdate((progressValue) => {
        setProgress(progressValue);
      });
      
      runtimeRef.current = runtime;
    }
  }, [onPhaseChange, onComplete]);

  // Load scene content
  useEffect(() => {
    const loadScene = async () => {
      if (!runtimeRef.current) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        if (sceneContent) {
          await runtimeRef.current.loadFromContent(sceneContent);
        } else if (sceneUrl) {
          await runtimeRef.current.loadFromUrl(sceneUrl);
        } else {
          throw new Error('Either sceneContent or sceneUrl must be provided');
        }
        
        const loadedConfig = runtimeRef.current.getConfig();
        setConfig(loadedConfig);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadScene();
  }, [sceneContent, sceneUrl, onError]);

  const handlePlay = () => {
    if (runtimeRef.current) {
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

  const handleSeek = (newTime: number) => {
    if (runtimeRef.current) {
      runtimeRef.current.seekTo(newTime);
      setProgress(newTime / (config?.total_duration || 1));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div 
        className={`sherlock-player loading ${className}`}
        style={{ width: dimensions.width, height: dimensions.height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ 
          color: '#58a6ff', 
          fontSize: '18px',
          textAlign: 'center'
        }}>
          <div>🕵️ Loading Sherlock Scene...</div>
          <div style={{ fontSize: '14px', color: '#7d8590', marginTop: '10px' }}>
            Parsing mathematical components
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`sherlock-player error ${className}`}
        style={{ width: dimensions.width, height: dimensions.height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ 
          color: '#f85149', 
          fontSize: '16px',
          textAlign: 'center',
          padding: '20px',
          border: '2px solid #f85149',
          borderRadius: '8px',
          backgroundColor: 'rgba(248, 81, 73, 0.1)'
        }}>
          <div>❌ Error Loading Scene</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#7d8590' }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  const isFullScreen = width === window.innerWidth && height === window.innerHeight;

  return (
    <div 
      ref={containerRef}
      className={`sherlock-player ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: config?.background || '#0d1117'
      }}
    >
      {/* Main Canvas */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ 
            maxWidth: '100%',
            maxHeight: '100%',
            border: isFullScreen ? 'none' : '1px solid #30363d',
            borderRadius: isFullScreen ? '0' : '8px',
            backgroundColor: config?.background || '#0d1117'
          }}
        />
      </div>
      
      {/* Minimal Controls */}
      {!isLoading && !error && (
        <>
          {/* Current Phase - Top Left */}
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            fontSize: '11px',
            color: 'rgba(212, 175, 55, 0.8)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '4px 8px',
            borderRadius: '4px',
            backdropFilter: 'blur(8px)',
            zIndex: 1000
          }}>
            {currentPhase || 'Ready'}
          </div>

          {/* Play/Pause/Stop Controls - Bottom Right */}
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000
          }}>
            <div style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(8px)'
            }}>
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: isPlaying ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.4)',
                  color: isPlaying ? '#7d8590' : 'rgba(212, 175, 55, 0.9)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                ▶
              </button>
              
              <button
                onClick={handlePause}
                disabled={!isPlaying}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: !isPlaying ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.4)',
                  color: !isPlaying ? '#7d8590' : 'rgba(212, 175, 55, 0.9)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: !isPlaying ? 'not-allowed' : 'pointer',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                ⏸
              </button>
              
              <button
                onClick={handleStop}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'rgba(212, 175, 55, 0.4)',
                  color: 'rgba(212, 175, 55, 0.9)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                ⏹
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
