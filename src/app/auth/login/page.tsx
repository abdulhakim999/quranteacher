'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                    <span style={{ fontSize: '3rem' }}>📖</span>
                </div>
                <h1 className="auth-title">تسجيل الدخول</h1>
                <p className="auth-subtitle">أهلاً بك في معلم القرآن</p>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="label">البريد الإلكتروني</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            dir="ltr"
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">كلمة المرور</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            dir="ltr"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-error-light)',
                            color: 'var(--color-error)',
                            fontSize: 'var(--text-sm)',
                            marginBottom: 'var(--space-4)',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary w-full btn-lg"
                        disabled={loading}
                    >
                        {loading ? <div className="spinner" /> : 'تسجيل الدخول'}
                    </button>
                </form>

                <div className="auth-footer">
                    ليس لديك حساب؟{' '}
                    <Link href="/auth/signup">إنشاء حساب جديد</Link>
                </div>
            </div>
        </div>
    );
}
