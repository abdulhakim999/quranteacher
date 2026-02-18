import { NextRequest, NextResponse } from 'next/server';

/**
 * STT REST API endpoint.
 * Receives audio data and proxies to OpenAI Whisper API.
 * This is the REST fallback — WebSocket streaming is preferred for production.
 */
export async function POST(request: NextRequest) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'your-openai-api-key-here') {
        return NextResponse.json(
            {
                text: '',
                error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local',
            },
            { status: 500 }
        );
    }

    try {
        const audioBuffer = await request.arrayBuffer();

        // Convert raw PCM to WAV format for OpenAI API
        const wavBuffer = pcmToWav(audioBuffer, 16000, 16, 1);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });

        const formData = new FormData();
        formData.append('file', blob, 'audio.wav');
        formData.append('model', 'whisper-1');
        formData.append('language', 'ar');
        formData.append('response_format', 'verbose_json');
        formData.append('timestamp_granularities[]', 'word');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', errorText);
            return NextResponse.json({ text: '', error: 'STT API error' }, { status: 500 });
        }

        const result = await response.json();

        return NextResponse.json({
            text: result.text || '',
            words: result.words?.map((w: { word: string; start: number; end: number }) => ({
                word: w.word,
                start: w.start,
                end: w.end,
            })) || [],
            isFinal: true,
        });
    } catch (error) {
        console.error('STT endpoint error:', error);
        return NextResponse.json({ text: '', error: 'Internal error' }, { status: 500 });
    }
}

/**
 * Convert raw PCM Int16 data to WAV format.
 */
function pcmToWav(
    pcmData: ArrayBuffer,
    sampleRate: number,
    bitsPerSample: number,
    numChannels: number
): ArrayBuffer {
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmData.byteLength;
    const headerSize = 44;
    const buffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);           // chunk size
    view.setUint16(20, 1, true);            // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // PCM data
    const pcmView = new Uint8Array(pcmData);
    const wavView = new Uint8Array(buffer);
    wavView.set(pcmView, headerSize);

    return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}
