import { NextRequest, NextResponse } from 'next/server';
import { escapeHtml, sanitizeFilename } from '@/lib/utils';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// POST - Export text as file
export async function POST(request: NextRequest) {
  try {
    const { content, format, filename } = await request.json();

    if (!content || !format) {
      return NextResponse.json(
        { success: false, error: 'Content and format are required' },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ['txt', 'md', 'html', 'docx']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { success: false, error: `Invalid format. Use: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    const safeFilename = sanitizeFilename(filename || 'documento');

    if (format === 'txt') {
      // Plain text export
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeFilename}.txt"`
        }
      });
    }

    if (format === 'md') {
      // Markdown export
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeFilename}.md"`
        }
      });
    }

    if (format === 'html') {
      // HTML export with proper XSS protection
      const escapedContent = escapeHtml(content)
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(safeFilename)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; color: #333; }
    p { margin-bottom: 1.5em; text-align: justify; }
  </style>
</head>
<body>
${escapedContent.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n')}
</body>
</html>`;

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeFilename}.html"`
        }
      });
    }

    if (format === 'docx') {
      // Real DOCX export using docx library
      const paragraphs = content.split('\n\n').map(para => {
        // Check if it's a heading (starts with #)
        if (para.startsWith('# ')) {
          return new Paragraph({
            text: para.slice(2),
            heading: HeadingLevel.HEADING_1,
          })
        }
        if (para.startsWith('## ')) {
          return new Paragraph({
            text: para.slice(3),
            heading: HeadingLevel.HEADING_2,
          })
        }
        if (para.startsWith('### ')) {
          return new Paragraph({
            text: para.slice(4),
            heading: HeadingLevel.HEADING_3,
          })
        }
        
        // Regular paragraph
        return new Paragraph({
          children: [
            new TextRun({
              text: para.replace(/\n/g, ' '),
              size: 24, // 12pt
              font: 'Calibri',
            })
          ],
          spacing: {
            after: 200,
          }
        })
      })

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: safeFilename,
                  bold: true,
                  size: 32,
                  font: 'Calibri',
                })
              ],
              spacing: {
                after: 400,
              }
            }),
            ...paragraphs
          ],
        }],
      })

      const buffer = await Packer.toBuffer(doc)

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeFilename}.docx"`
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export' },
      { status: 500 }
    );
  }
}
