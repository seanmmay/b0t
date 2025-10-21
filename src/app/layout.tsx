import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { AppLoader } from "@/components/ui/app-loader";
import { CatMascot } from "@/components/ui/cat-mascot";

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
        <AppLoader />
        <NextTopLoader
          color="#ff6b35"
          height={2}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #ff6b35,0 0 5px #ff6b35"
        />
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
        <CatMascot />
      </body>
    </html>
  );
}
