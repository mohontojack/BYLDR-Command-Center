import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BYLDR Command Center",
  description:
    "The operational hub for VSUAL Digital Media — manage leads through every funnel stage, track tasks, automate workflows, and run your agency at peak efficiency.",
  keywords: [
    "BYLDR",
    "Command Center",
    "VSUAL Digital Media",
    "task management",
    "funnel execution",
    "lead management",
    "marketing agency",
    "automation",
  ],
  authors: [{ name: "VSUAL Digital Media" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "BYLDR Command Center",
    description:
      "The operational hub for VSUAL Digital Media — manage leads, track tasks, and automate workflows.",
    siteName: "BYLDR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BYLDR Command Center",
    description:
      "The operational hub for VSUAL Digital Media — manage leads, track tasks, and automate workflows.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
