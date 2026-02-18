'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName },
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="card auth-card" style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '4rem', display: 'block', marginBottom: 'var(--space-4)' }}>✅</span>
                    <h2 className="auth-title">تم إنشاء الحساب</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
                        تحقق من بريدك الإلكتروني لتأكيد الحساب
                    </p>
                    <Link href="/auth/login" className="btn btn-primary w-full btn-lg">
                        العودة لتسجيل الدخول
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                    <span style={{ fontSize: '3rem' }}>📖</span>
                </div>
                <h1 className="auth-title">إنشاء حساب جديد</h1>
                <p className="auth-subtitle">ابدأ رحلتك في تصحيح التلاوة</p>

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label className="label">الاسم</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="اسمك الكريم"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>

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
                            placeholder="٨ أحرف على الأقل"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
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
                        {loading ? <div className="spinner" /> : '✨ إنشاء الحساب'}
                    </button>
                </form>

                <div className="auth-footer">
                    لديك حساب بالفعل؟{' '}
                    <Link href="/auth/login">تسجيل الدخول</Link>
                </div>
            </div>
        </div>
    );
}
