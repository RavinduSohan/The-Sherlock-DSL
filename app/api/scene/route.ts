import { NextRequest, NextResponse } from 'next/server';
import { SherlockParser } from '@/lib/core/sherlockParser';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileName = searchParams.get('file');
  
  if (!fileName) {
    return NextResponse.json({ error: 'File parameter required' }, { status: 400 });
  }
  
  try {
    const previewFile = process.env.SHERLOCK_PREVIEW_FILE;
    const requestedName = fileName.endsWith('.sherlock') ? fileName.slice(0, -9) : fileName;
    const previewSceneName = previewFile ? path.basename(previewFile, '.sherlock') : null;

    // Read the Sherlock file content
    const filePath = previewFile && previewSceneName === requestedName
      ? previewFile
      : path.join(process.cwd(), 'scenes', fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Use SherlockParser to parse the content (handles both presets and regular scenes)
    const parser = new SherlockParser();
    const scene = parser.parse(fileContents);
    
    return NextResponse.json(scene);
  } catch (error) {
    return NextResponse.json({ 
      error: `Failed to load scene: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
