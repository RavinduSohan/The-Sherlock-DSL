import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params in Next.js 15
    const params = await context.params;
    
    // Get the file path from the URL
    const filePath = params.path.join('/');
    
    // Resolve to root images directory
    const fullPath = path.join(process.cwd(), 'images', filePath);
    
    console.log(`🖼️  Looking for image at: ${fullPath}`);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ Image not found: ${fullPath}`);
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Determine content type based on extension
    const ext = path.extname(fullPath).toLowerCase();
    const contentTypeMap: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    console.log(`✅ Serving image: ${fullPath} (${contentType})`);
    
    // Return the image with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('❌ Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
