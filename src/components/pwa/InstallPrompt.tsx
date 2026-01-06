/**
 * InstallPrompt Component
 * Banner para instalar la PWA
 */

'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardBody } from '@/components/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detectar si ya está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Si ya está instalado o se cerró el prompt antes, no mostrar
    const promptDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (standalone || promptDismissed === 'true') {
      return;
    }

    // Capturar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS, mostrar instrucciones después de 3 segundos
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt de instalación
    await deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);

    // Limpiar el prompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    // Guardar que se interactuó con el prompt
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // No mostrar si ya está instalado
  if (isStandalone) {
    return null;
  }

  // No mostrar si está oculto
  if (!showPrompt) {
    return null;
  }

  // Prompt para iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <Card variant="elevated">
          <CardBody>
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                <span className="text-3xl">📱</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-2">
                  Instalar Finora Balance
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Instala esta app en tu iPhone:
                </p>
                <ol className="text-xs text-gray-600 space-y-1 mb-4">
                  <li>1. Toca el botón <strong>Compartir</strong> {' '}
                    <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  </li>
                  <li>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>3. Toca <strong>"Añadir"</strong></li>
                </ol>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  fullWidth
                >
                  Entendido
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Prompt para Android/Desktop
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-300">
      <Card variant="elevated">
        <CardBody>
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
              <span className="text-3xl">📱</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-2">
                Instalar Finora Balance
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Instala la app para acceder más rápido y usarla offline
              </p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleInstall}
                  fullWidth
                >
                  Instalar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                >
                  Ahora no
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}