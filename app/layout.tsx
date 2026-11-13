import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import "./globals.css";

// Letra cursiva para o nome dos convidados e serifada para o texto do convite
const cursiva = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-script", display: "swap" });
const serifada = Cormorant_Garamond({
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mariana & Maicon | Convite de casamento",
  description: "Celebre com Mariana e Maicon em 9 de julho de 2027, no Recanto Januário, em Sumaré.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#c1cee4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${cursiva.variable} ${serifada.variable}`}>
      <body>{children}</body>
    </html>
  );
}
