import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const previewFile = process.env.SHERLOCK_PREVIEW_FILE;
    if (previewFile && fs.existsSync(previewFile)) {
      const sceneName = path.basename(previewFile, '.sherlock');
      return NextResponse.json([sceneName]);
    }

    // Read the scenes directory
    const scenesDir = path.join(process.cwd(), 'scenes');
    
    // Check if directory exists
    if (!fs.existsSync(scenesDir)) {
      return NextResponse.json({ error: 'Scenes directory not found' }, { status: 404 });
    }
    
    // Read all files in the scenes directory
    const files = fs.readdirSync(scenesDir);
    
    // Filter for .sherlock files only
    const sherlockFiles = files
      .filter(file => file.endsWith('.sherlock'))
      .map(file => file.replace('.sherlock', ''))
      .sort();
    
    return NextResponse.json(sherlockFiles);
  } catch (error) {
    return NextResponse.json({ 
      error: `Failed to list scene files: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
