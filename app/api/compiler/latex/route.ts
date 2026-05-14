import { NextResponse } from 'next/server';
import katex from 'katex';

export async function POST(request: Request) {
  try {
    const { latex, options } = await request.json();
    
    if (!latex) {
      return NextResponse.json({ error: 'LaTeX content is required' }, { status: 400 });
    }

    const renderOptions = {
      displayMode: options?.displayMode ?? true,
      throwOnError: false,
      errorColor: '#ff6b6b',
      macros: {
        '\\vec': '\\mathbf{#1}',
        '\\matrix': '\\begin{bmatrix}#1\\end{bmatrix}',
        '\\eigen': '\\lambda',
        '\\transpose': '^{\\mathrm{T}}',
      },
      ...options
    };

    // Actually validate LaTeX by attempting to render it
    try {
      const renderedHtml = katex.renderToString(latex, renderOptions);
      
      return NextResponse.json({
        success: true,
        latex,
        renderOptions,
        renderedHtml,
        isValid: true
      });
    } catch (katexError) {
      // LaTeX is invalid
      return NextResponse.json({
        success: false,
        latex,
        renderOptions,
        error: `Invalid LaTeX: ${katexError instanceof Error ? katexError.message : 'Unknown KaTeX error'}`,
        isValid: false
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: `LaTeX processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
