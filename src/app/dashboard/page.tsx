'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Profile {
    display_name: string;
    last_surah: number;
    last_ayah: number;
}

interface Session {
    id: string;
    surah_number: number;
    word_errors: number;
    harakat_errors: number;
    score: number;
    duration_seconds: number;
    created_at: string;
}

interface Progress {
    date: string;
    minutes_practiced: number;
    ayahs_completed: number;
}

export default function DashboardPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = '/auth/login';
                return;
            }

            // Load profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) setProfile(profileData);

            // Load recent sessions
            const { data: sessionsData } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (sessionsData) setSessions(sessionsData);

            // Load progress
            const { data: progressData } = await supabase
                .from('progress')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(30);

            if (progressData) {
                setProgress(progressData);

                // Calculate streak
                let s = 0;
                const today = new Date().toISOString().split('T')[0];
                for (const p of progressData) {
                    const diff = Math.floor(
                        (new Date(today).getTime() - new Date(p.date).getTime()) / (86400000)
                    );
                    if (diff === s) {
                        s++;
                    } else {
                        break;
                    }
                }
                setStreak(s);
            }

            setLoading(false);
        }

        loadData();
    }, []);

    const totalMinutes = progress.reduce((sum, p) => sum + p.minutes_practiced, 0);
    const totalAyahs = progress.reduce((sum, p) => sum + p.ayahs_completed, 0);

    if (loading) {
        return (
            <div className="page">
                <Navbar />
                <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <Navbar />
            <div className="page-content">
                <div className="container">
                    {/* Welcome */}
                    <div style={{ marginBottom: 'var(--space-8)' }}>
                        <h1 style={{
                            fontFamily: 'var(--font-arabic)',
                            fontSize: 'var(--text-3xl)',
                            marginBottom: 'var(--space-2)',
                        }}>
                            مرحباً، {profile?.display_name || 'مستخدم'} 👋
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            استمر في رحلتك مع القرآن الكريم
                        </p>
                    </div>

                    {/* Continue Banner */}
                    {profile && (
                        <div className="card" style={{
                            marginBottom: 'var(--space-6)',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(245, 158, 11, 0.05))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 'var(--space-4)',
                        }}>
                            <div>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                                    آخر موضع قراءة
                                </p>
                                <p style={{ fontFamily: 'var(--font-arabic)', fontSize: 'var(--text-xl)' }}>
                                    سورة {profile.last_surah} — آية {profile.last_ayah}
                                </p>
                            </div>
                            <Link href={`/recite?surah=${profile.last_surah}&ayah=${profile.last_ayah}`} className="btn btn-primary">
                                ▶ استمرار التلاوة
                            </Link>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
                        <div className="card stat-card">
                            <div className="stat-icon">🔥</div>
                            <div className="stat-value">{streak}</div>
                            <div className="stat-label">أيام متتالية</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-icon">⏱️</div>
                            <div className="stat-value">{totalMinutes}</div>
                            <div className="stat-label">دقائق التمرين</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-icon">📖</div>
                            <div className="stat-value">{totalAyahs}</div>
                            <div className="stat-label">آية مكتملة</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-icon">🎯</div>
                            <div className="stat-value">{sessions.length}</div>
                            <div className="stat-label">جلسات التلاوة</div>
                        </div>
                    </div>

                    {/* Recent Sessions */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">📋 الجلسات الأخيرة</h2>
                        </div>

                        {sessions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                                <p>لا توجد جلسات بعد</p>
                                <Link href="/recite" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                                    ابدأ أول جلسة
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {sessions.map((session) => (
                                    <div key={session.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-3) var(--space-4)',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-hover)',
                                        flexWrap: 'wrap',
                                        gap: 'var(--space-2)',
                                    }}>
                                        <div>
                                            <span style={{ fontFamily: 'var(--font-arabic)', fontWeight: 600 }}>
                                                سورة {session.surah_number}
                                            </span>
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginRight: 'var(--space-3)' }}>
                                                {new Date(session.created_at).toLocaleDateString('ar')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
                                            <span style={{ color: session.word_errors > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                                                ⚠️ {session.word_errors}
                                            </span>
                                            <span style={{ color: session.harakat_errors > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                                🔤 {session.harakat_errors}
                                            </span>
                                            <span>⏱️ {Math.round(session.duration_seconds / 60)}د</span>
                                            {session.score && (
                                                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                                    {session.score}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
