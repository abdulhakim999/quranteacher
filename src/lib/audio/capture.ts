/**
 * WebAudio capture utilities.
 * Captures microphone audio, resamples to 16kHz mono, and chunks it.
 */

export interface AudioCaptureOptions {
    sampleRate?: number;  // Target sample rate (default: 16000)
    chunkDurationMs?: number; // Chunk duration in ms (default: 500)
    onChunk?: (chunk: Float32Array) => void;
    onError?: (error: Error) => void;
}

const DEFAULT_OPTIONS: AudioCaptureOptions = {
    sampleRate: 16000,
    chunkDurationMs: 500,
};

export class AudioCapture {
    private stream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private options: AudioCaptureOptions;
    private buffer: Float32Array[] = [];
    private bufferLength = 0;
    private isCapturing = false;

    constructor(options: AudioCaptureOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Start capturing audio from the microphone.
     */
    async start(): Promise<void> {
        if (this.isCapturing) return;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: this.options.sampleRate,
                },
            });

            this.audioContext = new AudioContext({
                sampleRate: this.options.sampleRate,
            });

            this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

            // Use ScriptProcessor for broad browser compatibility
            const bufferSize = 4096;
            this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

            const chunkSamples = Math.floor(
                (this.options.sampleRate! * this.options.chunkDurationMs!) / 1000
            );

            this.processor.onaudioprocess = (event) => {
                if (!this.isCapturing) return;

                const inputData = event.inputBuffer.getChannelData(0);
                const copy = new Float32Array(inputData.length);
                copy.set(inputData);
                this.buffer.push(copy);
                this.bufferLength += copy.length;

                // When we have enough samples for a chunk, emit it
                if (this.bufferLength >= chunkSamples) {
                    const chunk = this.mergeBuffers(chunkSamples);
                    this.options.onChunk?.(chunk);
                }
            };

            this.sourceNode.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            this.isCapturing = true;
        } catch (error) {
            this.options.onError?.(error as Error);
            throw error;
        }
    }

    /**
     * Stop capturing audio.
     */
    stop(): void {
        this.isCapturing = false;

        // Flush remaining buffer
        if (this.bufferLength > 0 && this.options.onChunk) {
            const chunk = this.mergeBuffers(this.bufferLength);
            this.options.onChunk(chunk);
        }

        this.processor?.disconnect();
        this.sourceNode?.disconnect();
        this.audioContext?.close();
        this.stream?.getTracks().forEach(track => track.stop());

        this.processor = null;
        this.sourceNode = null;
        this.audioContext = null;
        this.stream = null;
        this.buffer = [];
        this.bufferLength = 0;
    }

    /**
     * Check if currently capturing.
     */
    get capturing(): boolean {
        return this.isCapturing;
    }

    /**
     * Merge buffer chunks into a single Float32Array of the specified length.
     */
    private mergeBuffers(length: number): Float32Array {
        const result = new Float32Array(length);
        let offset = 0;

        while (offset < length && this.buffer.length > 0) {
            const chunk = this.buffer[0];
            const remaining = length - offset;

            if (chunk.length <= remaining) {
                result.set(chunk, offset);
                offset += chunk.length;
                this.buffer.shift();
                this.bufferLength -= chunk.length;
            } else {
                result.set(chunk.subarray(0, remaining), offset);
                this.buffer[0] = chunk.subarray(remaining);
                this.bufferLength -= remaining;
                offset += remaining;
            }
        }

        return result;
    }
}

/**
 * Convert Float32Array PCM data to Int16 PCM bytes for transmission.
 */
export function float32ToInt16(float32: Float32Array): ArrayBuffer {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16.buffer;
}

/**
 * Encode Float32Array to base64 for API transmission.
 */
export function encodeAudioBase64(float32: Float32Array): string {
    const buffer = float32ToInt16(float32);
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
