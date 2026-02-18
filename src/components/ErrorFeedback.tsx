'use client';

import type { RecitationError } from '@/lib/quran/types';
import { useEffect, useState } from 'react';

interface ErrorFeedbackProps {
    errors: RecitationError[];
    maxToasts?: number;
}

interface Toast {
    id: string;
    message: string;
    type: 'word' | 'haraka' | 'success';
    timestamp: number;
}

export default function ErrorFeedback({ errors, maxToasts = 3 }: ErrorFeedbackProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        if (errors.length === 0) return;

        const latestError = errors[errors.length - 1];
        let message = '';
        let type: Toast['type'] = 'word';

        if (latestError.type === 'MISSING') {
            message = `كلمة ناقصة: ${latestError.expectedWord}`;
            type = 'word';
        } else if (latestError.type === 'SUBSTITUTION') {
            message = `خطأ في الكلمة: "${latestError.spokenWord}" ← المتوقع: "${latestError.expectedWord}"`;
            type = 'word';
        } else if (latestError.type === 'EXTRA') {
            message = `كلمة زائدة: "${latestError.spokenWord}"`;
            type = 'word';
        } else if (latestError.type === 'HARAKAT_MISMATCH') {
            if (latestError.isHighConfidence) {
                message = `خطأ في الحركة: المتوقع ${latestError.expectedHaraka}${latestError.detectedHaraka ? ` ← تم نطق ${latestError.detectedHaraka}` : ''}`;
            } else {
                message = `تحقق من حركة الكلمة: ${latestError.expectedWord}`;
            }
            type = 'haraka';
        }

        if (message) {
            const toast: Toast = {
                id: `${Date.now()}-${Math.random()}`,
                message,
                type,
                timestamp: Date.now(),
            };

            setToasts((prev) => [...prev.slice(-(maxToasts - 1)), toast]);
        }
    }, [errors, maxToasts]);

    // Auto-dismiss toasts after 4 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setToasts((prev) => prev.filter((t) => Date.now() - t.timestamp < 4000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="error-toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`error-toast toast-${toast.type}`}>
                    <span>{toast.type === 'word' ? '⚠️' : toast.type === 'haraka' ? '🔤' : '✅'}</span>
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
