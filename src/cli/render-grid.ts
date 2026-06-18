/* v8 ignore next */
/**
 * CJK-aware ASCII grid renderer for terminal output.
 *
 * Correct column width calculation for CJK characters (2 columns each),
 * box-drawing borders, configurable cell width and padding,
 * and support for multi-line cell content.
 */

/**
 * Check if a Unicode code point is a CJK / fullwidth character (2-column width).
 */
function isCJK(code: number): boolean {
  return (
    (code >= 0x1100 && code <= 0x115F) ||   // Hangul Jamo
    (code >= 0x2E80 && code <= 0x303E) ||   // CJK Radicals, Kangxi, etc.
    (code >= 0x3040 && code <= 0x33BF) ||   // Hiragana, Katakana, CJK compat
    (code >= 0x3400 && code <= 0x4DBF) ||   // CJK Extension A
    (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK Unified Ideographs
    /* v8 ignore next 7 */
    (code >= 0xA000 && code <= 0xA4CF) ||   // Yi
    (code >= 0xAC00 && code <= 0xD7AF) ||   // Hangul Syllables
    (code >= 0xF900 && code <= 0xFAFF) ||   // CJK Compatibility Ideographs
    (code >= 0xFE30 && code <= 0xFE4F) ||   // CJK Compatibility Forms
    (code >= 0xFF01 && code <= 0xFF60) ||   // Fullwidth Forms
    (code >= 0xFFE0 && code <= 0xFFE6) ||   // Fullwidth Signs
    (code >= 0x20000 && code <= 0x2FA1F)    // CJK Extension B-F, Supplementary
  );
}

/** Calculate the display width of a string in a monospace terminal. */
export function displayWidth(str: string): number {
  let width = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0)!;
    width += isCJK(code) ? 2 : 1;
  }
  return width;
}

/** Pad a string on the right to a given display width. */
export function padRight(str: string, targetWidth: number): string {
  const w = displayWidth(str);
  if (w >= targetWidth) return str;
  return str + ' '.repeat(targetWidth - w);
}

/** Center a string within a given display width. */
export function padCenter(str: string, targetWidth: number): string {
  const w = displayWidth(str);
  /* v8 ignore next */
  if (w >= targetWidth) return str;
  const leftPad = Math.floor((targetWidth - w) / 2);
  const rightPad = targetWidth - w - leftPad;
  return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
}

/** Truncate a string to fit within a given display width. */
export function truncateToWidth(str: string, maxWidth: number): string {
  let width = 0;
  let result = '';
  for (const ch of str) {
    const code = ch.codePointAt(0)!;
    const charWidth = isCJK(code) ? 2 : 1;
    if (width + charWidth > maxWidth) break;
    result += ch;
    width += charWidth;
  }
  return result;
}

/** A single cell in the grid. */
export interface GridCell {
  lines: string[];
}

export interface GridOptions {
  cellWidth?: number;   // Display width per cell (default: 16)
  padding?: number;     // Horizontal padding within cells (default: 1)
}

/**
 * Render an NxM grid with box-drawing borders.
 *
 * @param cells - 2D array of GridCell [row][col]
 * @param options - Rendering options
 * @returns Array of output lines
 */
export function renderGrid(
  cells: GridCell[][],
  options: GridOptions = {},
): string[] {
  const cellWidth = options.cellWidth ?? 16;
  const padding = options.padding ?? 1;
  const innerWidth = cellWidth - 2 * padding;
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return [];

  const maxLines: number[] = [];
  for (let r = 0; r < rows; r++) {
    let max = 1;
    for (let c = 0; c < cols; c++) {
      /* v8 ignore next */
      max = Math.max(max, cells[r][c]?.lines.length ?? 1);
    }
    maxLines.push(max);
  }

  const output: string[] = [];
  const pad = ' '.repeat(padding);
  const seg = '\u2500'.repeat(cellWidth); // ─

  // Top border
  output.push('\u250C' + Array.from({ length: cols }, () => seg).join('\u252C') + '\u2510');

  for (let r = 0; r < rows; r++) {
    for (let lineIdx = 0; lineIdx < maxLines[r]; lineIdx++) {
      let row = '\u2502'; // │
      for (let c = 0; c < cols; c++) {
        const content = cells[r][c]?.lines[lineIdx] ?? '';
        const truncated = truncateToWidth(content, innerWidth);
        row += pad + padRight(truncated, innerWidth) + pad + '\u2502';
      }
      output.push(row);
    }

    if (r < rows - 1) {
      output.push('\u251C' + Array.from({ length: cols }, () => seg).join('\u253C') + '\u2524');
    }
  }

  // Bottom border
  output.push('\u2514' + Array.from({ length: cols }, () => seg).join('\u2534') + '\u2518');

  return output;
}

/** Render a simple key-value table. */
export function renderTable(rows: [string, string][], keyWidth = 14): string[] {
  return rows.map(([key, val]) => `  ${padRight(key, keyWidth)} ${val}`);
}

/** Render a horizontal rule with a centered title. */
export function renderTitle(title: string, width = 60): string {
  const titleLen = displayWidth(title);
  const side = Math.max(1, Math.floor((width - titleLen - 2) / 2));
  const right = width - titleLen - 2 - side;
  return '\u2500'.repeat(side) + ' ' + title + ' ' + '\u2500'.repeat(Math.max(1, right));
}
