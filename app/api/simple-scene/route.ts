import { NextResponse } from 'next/server';
import { SherlockParser } from '@/lib/core/sherlockParser';

// Simple test scene for debugging
const SIMPLE_SCENE = `concept: "Simple Test Scene"
emoji: "✨"
total_duration: 6
background: "#0d1117"
autoplay: true
loop: false

subtitles:
  - "🎯 Simple test scene"
  - "✨ Basic vector animation"

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

export async function GET() {
  try {
    // Parse the simple scene
    const parser = new SherlockParser();
    const scene = parser.parse(SIMPLE_SCENE);
    
    return NextResponse.json(scene);
  } catch (error) {
    return NextResponse.json({ 
      error: `Failed to parse simple scene: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}