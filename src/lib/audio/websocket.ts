/**
 * WebSocket client for STT streaming.
 * Connects to the backend STT proxy and streams audio chunks,
 * receiving transcription results in real-time.
 */

import type { STTResponse } from '../quran/types';

export interface STTWebSocketOptions {
    url: string;
    authToken: string;
    language?: string;
    onTranscript: (response: STTResponse) => void;
    onError?: (error: Event | Error) => void;
    onClose?: () => void;
    onOpen?: () => void;
}

export class STTWebSocket {
    private ws: WebSocket | null = null;
    private options: STTWebSocketOptions;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 3;

    constructor(options: STTWebSocketOptions) {
        this.options = options;
    }

    /**
     * Connect to the STT WebSocket server.
     */
    connect(): void {
        const url = new URL(this.options.url);
        url.searchParams.set('token', this.options.authToken);
        url.searchParams.set('language', this.options.language || 'ar');

        this.ws = new WebSocket(url.toString());
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.options.onOpen?.();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as STTResponse;
                this.options.onTranscript(data);
            } catch (e) {
                console.error('STT WebSocket: Failed to parse message', e);
            }
        };

        this.ws.onerror = (event) => {
            this.options.onError?.(event);
        };

        this.ws.onclose = () => {
            this.options.onClose?.();
        };
    }

    /**
     * Send an audio chunk to the STT server.
     */
    sendAudio(audioData: ArrayBuffer): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(audioData);
        }
    }

    /**
     * Send a control message (e.g., end of stream).
     */
    sendControl(message: Record<string, unknown>): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Close the WebSocket connection.
     */
    disconnect(): void {
        if (this.ws) {
            // Send end-of-stream signal
            this.sendControl({ type: 'end' });
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Check if connected.
     */
    get connected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}
