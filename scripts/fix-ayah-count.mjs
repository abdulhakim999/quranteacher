/**
 * Fix ayahCount field in generated surah files.
 * The API uses a different field name, so we compute it from the array length.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SURAHS_DIR = path.join(__dirname, '..', 'public', 'data', 'quran', 'surahs');

const files = fs.readdirSync(SURAHS_DIR).filter(f => f.endsWith('.json'));
let fixed = 0;

for (const file of files) {
    const filePath = path.join(SURAHS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!data.ayahCount || data.ayahCount !== data.ayahs.length) {
        data.ayahCount = data.ayahs.length;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        fixed++;
    }
}

console.log(`Fixed ayahCount in ${fixed} files out of ${files.length} total.`);
