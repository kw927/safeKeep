import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NextAuthProvider from '@/context/NextAuthProvider';
import { SearchProvider }  from '@/context/SearchProvider';

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
            <SearchProvider>
            <html lang="en" className="h-full">
                <body className={`${inter.className} h-full`}>{children}</body>
            </html>
            </SearchProvider>
        </NextAuthProvider>
    )
}
