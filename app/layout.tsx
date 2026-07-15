import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";
import Script from "next/script";


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Megabyte Circuits Quote",
    description: "Get instant online PCB quotes from Megabyte Circuits",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <Script src="https://unpkg.com/pcb-stackup@^4.0.0/dist/pcb-stackup.min.js" strategy="beforeInteractive" />
                <Providers>
                    <TooltipProvider>
                        {children}
                        <Toaster />
                    </TooltipProvider>
                </Providers>
            </body>
        </html>
    );
}

