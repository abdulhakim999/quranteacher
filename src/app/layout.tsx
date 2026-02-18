import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "معلم القرآن | AI Quran Teacher",
  description: "تطبيق ذكي لتصحيح تلاوة القرآن الكريم - كشف أخطاء الكلمات والتشكيل بالذكاء الاصطناعي",
  keywords: ["قرآن", "تلاوة", "تصحيح", "ذكاء اصطناعي", "quran", "recitation", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
