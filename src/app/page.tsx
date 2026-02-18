import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="page" data-theme="dark">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08), transparent 60%)',
        }}>
          {/* Decorative background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.03) 0%, transparent 40%)',
          }} />

          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '5rem',
              marginBottom: 'var(--space-6)',
              filter: 'drop-shadow(0 0 40px rgba(16, 185, 129, 0.3))',
            }}>
              📖
            </div>

            <h1 style={{
              fontFamily: 'var(--font-arabic)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              marginBottom: 'var(--space-4)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.4,
            }}>
              معلم القرآن الذكي
            </h1>

            <p style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto var(--space-8)',
              lineHeight: 1.8,
            }}>
              تطبيق ذكي يستمع لتلاوتك ويصحح أخطاء الكلمات والتشكيل
              <br />
              باستخدام الذكاء الاصطناعي المتقدم
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/recite" className="btn btn-primary btn-lg" style={{ fontSize: 'var(--text-lg)' }}>
                🎙️ ابدأ التلاوة
              </Link>
              <Link href="/mushaf" className="btn btn-secondary btn-lg" style={{ fontSize: 'var(--text-lg)' }}>
                📖 تصفح المصحف
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: 'var(--space-16) 0' }}>
          <div className="container">
            <h2 style={{
              textAlign: 'center',
              fontFamily: 'var(--font-arabic)',
              fontSize: 'var(--text-3xl)',
              marginBottom: 'var(--space-12)',
              color: 'var(--text-primary)',
            }}>
              المزايا الرئيسية
            </h2>

            <div className="stats-grid" style={{ gap: 'var(--space-6)' }}>
              {[
                {
                  icon: '🎙️',
                  title: 'التلاوة المباشرة',
                  desc: 'استمع لتلاوتك في الوقت الحقيقي مع تحديد الموضع تلقائياً وتتبع الكلمات',
                },
                {
                  icon: '⚠️',
                  title: 'كشف الأخطاء',
                  desc: 'اكتشاف أخطاء الكلمات المفقودة والزائدة والمستبدلة مع تصحيح لحظي',
                },
                {
                  icon: '🔤',
                  title: 'فحص التشكيل',
                  desc: 'كشف أخطاء الحركات (فتحة، ضمة، كسرة، سكون، شدة) مع نظام ثقة متقدم',
                },
                {
                  icon: '🧠',
                  title: 'وضع الحفظ',
                  desc: 'إخفاء النص وكشفه تدريجياً لاختبار وتقوية حفظك',
                },
                {
                  icon: '🔍',
                  title: 'البحث الصوتي',
                  desc: 'انطق أي مقطع قرآني والنظام يبحث ويعرض الآيات المطابقة',
                },
                {
                  icon: '📊',
                  title: 'تتبع التقدم',
                  desc: 'لوحة تحكم شخصية مع إحصائيات الجلسات وسلسلة الأيام المتتالية',
                },
              ].map((feature, i) => (
                <div key={i} className="card stat-card" style={{ textAlign: 'center' }}>
                  <div className="stat-icon">{feature.icon}</div>
                  <h3 style={{
                    fontFamily: 'var(--font-arabic)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: 'var(--space-16) 0',
          textAlign: 'center',
          background: 'linear-gradient(180deg, transparent, rgba(16, 185, 129, 0.03))',
        }}>
          <div className="container">
            <p style={{
              fontFamily: 'var(--font-quran)',
              fontSize: 'var(--text-2xl)',
              color: 'var(--color-accent)',
              marginBottom: 'var(--space-6)',
              lineHeight: 2,
            }}>
              وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-8)' }}>
              سورة المزمل - آية ٤
            </p>
            <Link href="/auth/signup" className="btn btn-primary btn-lg">
              ✨ أنشئ حسابك الآن
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: 'var(--space-8) 0',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: 'var(--text-sm)',
      }}>
        <div className="container">
          <p>معلم القرآن — تطبيق مجاني لتصحيح التلاوة بالذكاء الاصطناعي</p>
        </div>
      </footer>
    </div>
  );
}
