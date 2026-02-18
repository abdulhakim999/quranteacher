/**
 * Generate Quran surah JSON files from the alquran.cloud API.
 * 
 * Fetches entire Quran Uthmani text in ONE request, then splits into per-surah files.
 * 
 * Usage: node scripts/generate-quran-data.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'quran', 'surahs');

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function main() {
    console.log('Fetching full Quran (Uthmani text)...');

    const res = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
    if (!res.ok) {
        throw new Error(`API request failed: HTTP ${res.status}`);
    }

    const json = await res.json();
    const surahs = json.data.surahs;

    console.log(`Received ${surahs.length} surahs. Generating JSON files...\n`);

    for (const surahData of surahs) {
        const paddedNum = String(surahData.number).padStart(3, '0');
        const outputPath = path.join(OUTPUT_DIR, `${paddedNum}.json`);

        const surah = {
            number: surahData.number,
            name: surahData.name,
            nameEnglish: surahData.englishName,
            nameTransliteration: surahData.englishNameTranslation,
            revelationType: surahData.revelationType,
            ayahCount: surahData.numberOfAyahs,
            ayahs: surahData.ayahs.map(ayah => {
                const text = ayah.text.trim();
                const words = text.split(/\s+/).map((word, index) => ({
                    index,
                    textUthmani: word,
                    textNormalized: "",
                    charOffset: 0
                }));

                // Compute charOffsets
                let offset = 0;
                for (const word of words) {
                    word.charOffset = offset;
                    offset += word.textUthmani.length + 1;
                }

                return {
                    number: ayah.numberInSurah,
                    text,
                    textNormalized: "",
                    juz: ayah.juz,
                    hizb: ayah.hizbQuarter,
                    page: ayah.page,
                    words
                };
            })
        };

        fs.writeFileSync(outputPath, JSON.stringify(surah, null, 2), 'utf-8');
        console.log(`  ✓ ${paddedNum}.json — ${surahData.englishName} (${surah.ayahCount} ayahs)`);
    }

    console.log(`\nDone! Generated ${surahs.length} surah files.`);
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
