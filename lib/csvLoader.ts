import fs from 'fs';
import path from 'path';

export function loadCSVFromFile(): string {
  const filePath = path.join(process.cwd(), 'public', 'collection.csv');
  return fs.readFileSync(filePath, 'utf-8');
}
