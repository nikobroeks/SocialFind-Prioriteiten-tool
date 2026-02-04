import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Notifications } from "@/components/notifications";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SocialFind Prioriteiten Dashboard",
  description: "Interne tool voor recruitment weekstarts prioriteitsbeheer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <Providers>
          {children}
          <Notifications />
        </Providers>
      </body>
    </html>
  );
}

