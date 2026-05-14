import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SherlockParser } from '@/lib/core/sherlockParser';

export async function GET() {
  try {
    // Read the timing test scene
    const scenePath = path.join(process.cwd(), 'scenes', 'timing_test.sherlock');
    const sceneContent = await fs.readFile(scenePath, 'utf8');
    
    // Parse the scene
    const parser = new SherlockParser();
    const scene = parser.parse(sceneContent);
    
    return NextResponse.json({
      scene,
      debug: {
        totalDuration: scene.total_duration,
        phaseCount: Object.keys(scene.phases).length,
        phases: Object.entries(scene.phases).map(([name, phase]) => ({
          name,
          duration: phase.duration,
          elementCount: Object.keys(phase.elements).length
        }))
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: `Failed to load timing test scene: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
