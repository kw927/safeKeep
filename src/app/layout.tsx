import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NextAuthProvider from '@/context/NextAuthProvider';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'SafeKeep',
    description: 'A Safe and Secure way to store your files and data',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <NextAuthProvider>
            <html lang="en" className="h-full">
                <body className={`${inter.className} h-full`}>{children}</body>
            </html>
        </NextAuthProvider>
    )
}
