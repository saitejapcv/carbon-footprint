import { describe, it, expect } from 'vitest';
import app from '../../app.js';

describe('Markdown Parser', () => {
  it('should strip frontmatter yaml content', () => {
    const input = `---
layout: post
title: Hello World
---
# Main Header`;
    const result = app.parseMarkdownToHTML(input);
    expect(result).not.toContain('layout: post');
    expect(result).toContain('<h1>Main Header</h1>');
  });

  it('should convert headers to appropriate HTML tags', () => {
    expect(app.parseMarkdownToHTML('# Header 1')).toContain('<h1>Header 1</h1>');
    expect(app.parseMarkdownToHTML('## Header 2')).toContain('<h2>Header 2</h2>');
    expect(app.parseMarkdownToHTML('### Header 3')).toContain('<h3>Header 3</h3>');
  });

  it('should convert double asterisks to strong tags', () => {
    expect(app.parseMarkdownToHTML('This is **bold** text')).toContain('<strong>bold</strong>');
  });

  it('should convert markdown links to secure anchor tags', () => {
    const input = 'Visit [Google](https://google.com) for details.';
    const expected = '<a href="https://google.com" target="_blank" rel="noopener noreferrer">Google</a>';
    expect(app.parseMarkdownToHTML(input)).toContain(expected);
  });

  it('should convert blockquotes', () => {
    const input = '> This is a quote';
    expect(app.parseMarkdownToHTML(input)).toContain('<blockquote>This is a quote</blockquote>');
  });

  it('should convert lists into unordered list blocks and handle ending boundaries', () => {
    const input = `- Item 1\n- Item 2\n\nThis is a normal paragraph following the list.`;
    const result = app.parseMarkdownToHTML(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
    expect(result).toContain('</ul>');
    expect(result).toContain('<p>This is a normal paragraph following the list.</p>');
  });

  it('should convert a list that ends exactly at the end of the markdown string', () => {
    const input = `- Item A\n- Item B`;
    const result = app.parseMarkdownToHTML(input);
    expect(result).toBe('<ul>\n<li>Item A</li>\n<li>Item B</li>\n</ul>');
  });

  it('should convert tables into complete HTML table structures and handle boundaries', () => {
    const input = `| Category | Value |
|---|---|
| Transport | 12.5 |
| Diet | 4.2 |

This is a paragraph following the table.`;
    const result = app.parseMarkdownToHTML(input);
    expect(result).toContain('<table>');
    expect(result).toContain('<thead>');
    expect(result).toContain('<tr><th>Category</th><th>Value</th></tr>');
    expect(result).toContain('<tbody>');
    expect(result).toContain('<tr><td>Transport</td><td>12.5</td></tr>');
    expect(result).toContain('<tr><td>Diet</td><td>4.2</td></tr>');
    expect(result).toContain('</tbody>');
    expect(result).toContain('</table>');
    expect(result).toContain('<p>This is a paragraph following the table.</p>');
  });

  it('should convert a table that ends exactly at the end of the markdown string', () => {
    const input = `| Category | Value |
|---|---|
| Transport | 12.5 |`;
    const result = app.parseMarkdownToHTML(input);
    expect(result).toContain('<table>');
    expect(result).toContain('</table>');
  });

  it('should handle tables without a body separator (no tbody)', () => {
    const input1 = `| Header 1 | Header 2 |\n| Cell 1 | Cell 2 |\n\nThis is a paragraph.`;
    const result1 = app.parseMarkdownToHTML(input1);
    expect(result1).toContain('<table>');
    expect(result1).not.toContain('<tbody>');
    expect(result1).toContain('</table>');

    const input2 = `| Header 1 | Header 2 |\n| Cell 1 | Cell 2 |`;
    const result2 = app.parseMarkdownToHTML(input2);
    expect(result2).toContain('<table>');
    expect(result2).not.toContain('<tbody>');
    expect(result2).toContain('</table>');
  });

  it('should wrap plain text lines in paragraphs', () => {
    const input = 'This is a normal paragraph line.';
    expect(app.parseMarkdownToHTML(input)).toBe('<p>This is a normal paragraph line.</p>');
  });

  it('should handle empty paragraphs and preserve HTML structures from paragraph wrapping', () => {
    const input = '\n\nParagraph 1\n\n\n\nParagraph 2\n\n';
    const result = app.parseMarkdownToHTML(input);
    expect(result).toContain('<p>Paragraph 1</p>');
    expect(result).toContain('<p>Paragraph 2</p>');
    
    // Test that headings and structural tags are not wrapped in paragraphs
    const headingInput = '# Heading\n\nSome text';
    const headingResult = app.parseMarkdownToHTML(headingInput);
    expect(headingResult).toContain('<h1>Heading</h1>');
    expect(headingResult).not.toContain('<p><h1>Heading</h1></p>');
  });

  it('should sanitize javascript and data links in markdown to #', () => {
    const jsInput = 'Click [here](javascript:alert(1)) to test.';
    const dataInput = 'Click [here](data:text/html,<script>alert(1)</script>) to test.';
    const vbInput = 'Click [here](vbscript:msgbox(1)) to test.';
    
    expect(app.parseMarkdownToHTML(jsInput)).toContain('href="#"');
    expect(app.parseMarkdownToHTML(dataInput)).toContain('href="#"');
    expect(app.parseMarkdownToHTML(vbInput)).toContain('href="#"');
  });

  it('should escape double quotes in link URLs to prevent attribute breakout', () => {
    const input = 'Click [here](https://example.com/test?a="b"&c=d) to test.';
    // Note: & was already escaped to &amp; earlier in parseMarkdownToHTML
    expect(app.parseMarkdownToHTML(input)).toContain('href="https://example.com/test?a=&quot;b&quot;&amp;c=d"');
  });
});
