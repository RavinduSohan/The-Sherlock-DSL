'use client';

import { useState, useEffect } from 'react';
import SherlockPlayer from '@/components/SherlockPlayer';

export default function SceneTestPage() {
  const [sceneContent, setSceneContent] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<string>('');

  useEffect(() => {
    // Load the debug scene
    fetch('/api/debug-scene')
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          setSceneContent(data.content);
          console.log('Loaded scene:', data);
        }
      })
      .catch(err => console.error('Failed to load scene:', err));
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0d1117', 
      color: '#c9d1d9',
      padding: '20px'
    }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        color: '#58a6ff'
      }}>
        🕵️ Scene Test Page
      </h1>

      {currentPhase && (
        <div style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#21262d',
          borderRadius: '6px',
          fontSize: '16px'
        }}>
          <strong>Current Phase:</strong> {currentPhase}
        </div>
      )}

      {sceneContent ? (
        <div style={{
          border: '1px solid #30363d',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#000000'
        }}>
          <SherlockPlayer
            sceneContent={sceneContent}
            width={800}
            height={600}
            onPhaseChange={(phase) => {
              setCurrentPhase(phase);
              console.log('Phase changed to:', phase);
            }}
            onComplete={() => {
              console.log('Animation completed');
            }}
            onError={(error) => {
              console.error('Player error:', error);
            }}
          />
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '600px',
          backgroundColor: '#21262d',
          borderRadius: '8px',
          fontSize: '18px'
        }}>
          Loading scene...
        </div>
      )}

      {sceneContent && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Scene Source:</h3>
          <pre style={{
            backgroundColor: '#161b22',
            padding: '15px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            overflow: 'auto',
            border: '1px solid #30363d'
          }}>
            {sceneContent}
          </pre>
        </div>
      )}
    </div>
  );
}
