import './globals.css'
import "bootstrap/dist/css/bootstrap.min.css"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '../components/Header'
import { getAssociates } from '@/utils/pocketbase'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Amazon Kuiper Translogistics',
  description: 'Created by Alex Shaver',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const associates = await getAssociates();
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header associates={associates}/>
        {children}
      </body>
    </html>
  )
}
