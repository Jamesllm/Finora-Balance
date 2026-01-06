/**
 * AppLayout Component
 * Layout principal de la aplicación con sidebar y header
 */

'use client';

import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShortcutHelper } from '@/components/ShortcutHelper';
import { Wallet, LayoutDashboard, ArrowLeftRight, FolderOpen, TrendingUp, Settings } from 'lucide-react';

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const menuItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Transacciones', href: '/transactions', icon: ArrowLeftRight },
        { name: 'Categorías', href: '/categories', icon: FolderOpen },
        { name: 'Reportes', href: '/reports', icon: TrendingUp },
        { name: 'Configuración', href: '/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 transition-colors">
            {/* Sidebar Desktop */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 ${sidebarOpen ? 'w-64' : 'w-20'
                    } hidden lg:block`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            {sidebarOpen && (
                                <div>
                                    <h1 className="font-bold text-gray-800 dark:text-gray-100">Finora</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => router.push(item.href)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-left group"
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                    {sidebarOpen && (
                                        <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                            {item.name}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Info */}
                    <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                                    {user?.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            {sidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{user?.username}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Usuario activo</p>
                                </div>
                            )}
                        </div>
                        {sidebarOpen && (
                            <button
                                onClick={handleLogout}
                                className="w-full mt-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        )}
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="absolute -right-3 top-20 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full p-1.5 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                        <svg
                            className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-neutral-900 p-2 rounded-lg shadow-lg"
            >
                <svg className="w-6 h-6 text-gray-800 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile Sidebar */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
                    <aside className="absolute top-0 left-0 w-64 h-full bg-white dark:bg-neutral-900 shadow-xl border-r border-gray-200 dark:border-neutral-800">
                        <div className="h-full flex flex-col">
                            <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                                        <Wallet className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="font-bold text-gray-800 dark:text-gray-100">Finora</h1>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                                    </div>
                                </div>
                            </div>

                            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => {
                                                router.push(item.href);
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-left group"
                                        >
                                            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="p-4 border-t border-gray-200 dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                                            {user?.username.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{user?.username}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Usuario activo</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main
                className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                    }`}
            >
                {/* Header */}
                <header className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-30">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1" />

                            <div className="flex items-center gap-4">
                                <ThemeToggle />

                                {/* Notificaciones */}
                                <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                                </button>

                                {/* User Menu (Desktop) */}
                                <div className="hidden lg:flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.username}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Usuario</p>
                                    </div>
                                    <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                                            {user?.username.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>

            <ShortcutHelper />
        </div>
    );
}