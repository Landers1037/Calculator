import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Providers from "@/components/providers";
import logo from "@/assets/calculator-logo.jpg";
import "./globals.css";

export const metadata: Metadata = {
  title: "贷款利率计算器",
  description: "支持公积金、商贷、组合贷、提前还款与结果对比导出"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="text-slate-700">
        <Providers>
          <div className="mx-auto max-w-7xl px-3 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8">
            <header className="glass mb-6 flex flex-col gap-3 rounded-2xl px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <Link className="flex min-w-0 items-center gap-3" href="/">
                <Image alt="贷款利率计算器 Logo" className="h-10 w-10 rounded-xl object-cover" src={logo} />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900">贷款利率计算器</p>
                  <p className="text-xs text-slate-500">公积金 · 商贷 · 组合贷</p>
                </div>
              </Link>
              <nav className="flex w-full items-center justify-end gap-4 text-sm font-medium sm:w-auto">
                <Link className="text-slate-600 transition hover:text-blue-600" href="/">
                  首页
                </Link>
                <Link className="text-slate-600 transition hover:text-blue-600" href="/about">
                  关于算法
                </Link>
              </nav>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
