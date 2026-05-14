import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SherlockParser } from '@/lib/core/sherlockParser';

export async function POST(request: Request) {
  try {
    const { sceneName } = await request.json();
    
    if (!sceneName) {
      return NextResponse.json({ error: 'Scene name is required' }, { status: 400 });
    }

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
    
    // Read and parse file content
    const content = await fs.readFile(scenePath, 'utf8');
    const parser = new SherlockParser();
    const config = parser.parse(content);
    
    return NextResponse.json({
      success: true,
      sceneName,
      content,
      config,
      equations: config.equations || [],
      phases: Object.keys(config.phases),
      totalDuration: config.total_duration
    });
  } catch (error) {
    return NextResponse.json({
      error: `Failed to parse scene: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
