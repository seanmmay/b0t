import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/sonner";

const robotoHeading = Roboto_Mono({
  weight: "500",
  variable: "--font-heading",
  subsets: ["latin"],
});

const robotoBody = Roboto_Mono({
  weight: "400",
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Social Cat",
  description: "AI-powered social media automation platform",
  icons: {
    icon: '/cat-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoHeading.variable} ${robotoBody.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
