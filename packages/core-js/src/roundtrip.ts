/**
 * Parse a Markdown table back to JSON (array of objects).
 * Best-effort: works for flat tables produced by jsonmd.
 */
export function mdToJson(md: string): unknown {
  const lines = md.split('\n');
  const tables: { headers: string[]; rows: Record<string, unknown>[] }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Detect a table: line starts with |
    if (line.startsWith('|') && i + 1 < lines.length) {
      const headers = parseCells(line);
      const nextLine = lines[i + 1]?.trim();

      // Verify separator row
      if (nextLine && nextLine.startsWith('|') && nextLine.includes('---')) {
        i += 2; // skip header + separator
        const rows: Record<string, unknown>[] = [];

        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const cells = parseCells(lines[i].trim());
          const row: Record<string, unknown> = {};
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = coerce(cells[j] ?? '');
          }
          rows.push(row);
          i++;
        }

        // Key-Value table detection
        if (headers.length === 2 && headers[0] === 'Key' && headers[1] === 'Value') {
          const obj: Record<string, unknown> = {};
          for (const row of rows) {
            const key = String(row['Key'] ?? '');
            if (key) obj[key] = row['Value'];
          }
          tables.push({ headers, rows: [obj as Record<string, unknown>] });
        } else {
          tables.push({ headers, rows });
        }
        continue;
      }
    }

    i++;
  }

  if (tables.length === 0) return null;
  if (tables.length === 1) {
    const t = tables[0];
    // Key-Value table
    if (t.headers.length === 2 && t.headers[0] === 'Key' && t.headers[1] === 'Value') {
      return t.rows[0];
    }
    return t.rows;
  }

  // Multiple tables - return array of all rows
  return tables.flatMap((t) => t.rows);
}

function parseCells(line: string): string[] {
  // Split by | but not \|
  const inner = line.replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '\\' && i + 1 < inner.length && inner[i + 1] === '|') {
      current += '|';
      i++;
    } else if (inner[i] === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += inner[i];
    }
  }
  cells.push(current.trim());
  return cells;
}

function coerce(value: string): unknown {
  if (value === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  // Try number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }

  return value;
}
