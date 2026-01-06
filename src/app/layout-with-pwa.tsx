/**
 * Root Layout con PWA
 * Layout principal con metadatos PWA
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import PWAProvider from '@/components/pwa/PWAProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Metadatos para SEO y PWA
export const metadata: Metadata = {
    title: 'Finora Balance - Gestión Financiera Inteligente',
    description: 'Finora Balance: Tu aplicación de finanzas personales 100% offline. Gestiona ingresos, gastos y presupuestos con total privacidad y seguridad.',
    applicationName: 'Finora Balance',
    authors: [{ name: 'Finora Balance Team' }],
    keywords: ['finanzas', 'balance', 'finora', 'offline', 'presupuesto', 'gastos', 'ingresos', 'pwa'],
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Finora Balance',
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        type: 'website',
        siteName: 'Finora Balance',
        title: 'Finora Balance - Gestión Financiera Inteligente',
        description: 'Tu control financiero personal, seguro y sin conexión.',
    },
    twitter: {
        card: 'summary',
        title: 'Finora Balance',
        description: 'Gestión financiera personal inteligente y segura.',
    },
};

// Configuración del viewport
export const viewport: Viewport = {
    themeColor: '#3B82F6',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <head>
                {/* PWA Meta Tags */}
                <link rel="manifest" href="/manifest.json" />

                {/* Apple Touch Icons */}
                <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />

                {/* Apple Web App */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="Finora Balance" />

                {/* Microsoft */}
                <meta name="msapplication-TileColor" content="#3B82F6" />
                <meta name="msapplication-tap-highlight" content="no" />
            </head>
            <body className={inter.className}>
                <PWAProvider>
                    {children}
                </PWAProvider>
            </body>
        </html>
    );
}