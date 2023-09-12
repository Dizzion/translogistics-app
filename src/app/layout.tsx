import './globals.css'
import "bootstrap/dist/css/bootstrap.min.css";
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from './_components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Amazon Kuiper Translogistics',
  description: 'Created by Alex Shaver',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header/>
        {children}
      </body>
    </html>
  )
}
