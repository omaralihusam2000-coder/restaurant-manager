import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { getLocale, getTheme } from "@/lib/preferences";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "لمّة | نظام كاشير المطاعم",
  description: "نظام كاشير سهل وسريع ومتطور لإدارة المطاعم: نقطة بيع، طاولات، مطبخ، تقارير، وأكثر.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8622c",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = await getTheme();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} ${theme === "dark" ? "dark" : ""} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
