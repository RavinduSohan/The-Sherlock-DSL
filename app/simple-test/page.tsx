'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SherlockPlayer from '@/components/SherlockPlayer';

export default function SimpleTestPage() {
  const [sceneContent, setSceneContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSimpleScene = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/simple-scene');
        const data = await response.json();
        
        if (response.ok) {
          // Convert the parsed scene back to Sherlock DSL format for the player
          const dslContent = `concept: "${data.concept}"
emoji: "${data.emoji}"
total_duration: ${data.total_duration}
background: "${data.background}"
autoplay: ${data.autoplay}
loop: ${data.loop}

subtitles:
  - "${data.subtitles[0]}"
  - "${data.subtitles[1]}"

phases:
  intro:
    duration: 3
    description: "Show basic vector"
    elements:
      test_vector:
        type: vector
        from: [0, 0]
        to: [100, 50]
        color: "#ff6b6b"
        width: 3
        label: "Test"

  end:
    duration: 3
    description: "Vector transformation"
    elements:
      test_vector_2:
        type: vector
        from: [0, 0]
        to: [150, 100]
        color: "#4ecdc4"
        width: 3
        label: "Test2"`;
          
          setSceneContent(dslContent);
        } else {
          setError(data.error || 'Failed to load simple scene');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSimpleScene();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Loading simple test scene...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <h1 className="text-2xl font-bold text-white mb-4 text-center">
            Simple Sherlock Test Scene
          </h1>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <SherlockPlayer
              sceneContent={sceneContent}
              width={800}
              height={600}
              onError={(err) => setError(err)}
              onPhaseChange={(phase) => console.log('Phase changed:', phase)}
              onComplete={() => console.log('Animation complete')}
            />
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
              ← Back to Main Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}