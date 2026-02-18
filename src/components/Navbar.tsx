'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        const stored = localStorage.getItem('theme') as 'dark' | 'light' | null;
        if (stored) {
            setTheme(stored);
            document.documentElement.setAttribute('data-theme', stored);
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    const links = [
        { href: '/', label: 'الرئيسية', icon: '🏠' },
        { href: '/recite', label: 'التلاوة', icon: '🎙️' },
        { href: '/mushaf', label: 'المصحف', icon: '📖' },
        { href: '/memorize', label: 'الحفظ', icon: '🧠' },
        { href: '/search', label: 'البحث الصوتي', icon: '🔍' },
        { href: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    <span className="navbar-logo">📖</span>
                    <span className="navbar-title">معلم القرآن</span>
                </Link>

                <ul className="navbar-links">
                    {links.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
                            >
                                {link.icon} {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="navbar-actions">
                    <button
                        onClick={toggleTheme}
                        className="btn btn-ghost btn-icon"
                        title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <Link href="/auth/login" className="btn btn-primary">
                        تسجيل الدخول
                    </Link>
                </div>
            </div>
        </nav>
    );
}
