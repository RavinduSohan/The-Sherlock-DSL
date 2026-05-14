import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SherlockParser } from '@/lib/core/sherlockParser';

export async function GET() {
  try {
    // Read the debug test scene
    const scenePath = path.join(process.cwd(), 'scenes', 'debug_test.sherlock');
    const sceneContent = await fs.readFile(scenePath, 'utf8');
    
    // Parse the scene
    const parser = new SherlockParser();
    const scene = parser.parse(sceneContent);
    
    // Calculate phase timings for debugging
    const phases = Object.entries(scene.phases);
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
    
    return NextResponse.json({
      scene,
      content: sceneContent,
      debug: {
        totalDuration: scene.total_duration,
        phaseCount: phases.length,
        actualDuration: cumulativeTime,
        timingBuffer: scene.total_duration - cumulativeTime,
        phases: phaseTimings
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: `Failed to load debug scene: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
