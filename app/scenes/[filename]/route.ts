import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Extract the filename from the path (e.g., /scenes/test.sherlock -> test.sherlock)
  const filename = pathname.split('/').pop();
  
  if (!filename || !filename.endsWith('.sherlock')) {
    return NextResponse.json({ error: 'Invalid file request' }, { status: 400 });
  }
  
  try {
    const filePath = path.join(process.cwd(), 'scenes', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Scene file not found' }, { status: 404 });
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: `Failed to read scene file: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
