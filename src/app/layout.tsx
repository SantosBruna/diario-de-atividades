import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Navigation } from "@/components/Navigation";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Diário de Atividades",
  description: "Registre e analise como você utiliza seu tempo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className={styles.container}>
          <Navigation />
          <main className={styles.main}>{children}</main>
        </div>
      </body>
    </html>
  );
}
