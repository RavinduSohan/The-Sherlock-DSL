import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sceneName: string }> }
) {
  try {
    const { sceneName } = await params;
    const previewFile = process.env.SHERLOCK_PREVIEW_FILE;
    const previewSceneName = previewFile ? path.basename(previewFile, '.sherlock') : null;
    const scenePath = previewFile && previewSceneName === sceneName
      ? previewFile
      : path.join(process.cwd(), 'scenes', `${sceneName}.sherlock`);
    
    // Check if file exists
    try {
      await fs.access(scenePath);
    } catch {
      return NextResponse.json({ 
        error: `Scene '${sceneName}' not found` 
      }, { status: 404 });
    }
    
    // Read file content
    const content = await fs.readFile(scenePath, 'utf8');
    
    return NextResponse.json({ 
      name: sceneName,
      content
    });
  } catch (error) {
    return NextResponse.json({ 
      error: `Failed to load scene: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
