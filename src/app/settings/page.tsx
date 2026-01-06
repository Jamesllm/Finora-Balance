/**
 * app/(dashboard)/settings/page.tsx
 * Página de configuración completa con Theme y Currency integrados
 */

'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardBody } from '@/components/ui';
import UserProfile from '@/components/settings/UserProfile';
import ChangePinForm from '@/components/settings/ChangePinForm';
import CurrencySettings from '@/components/settings/CurrencySettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import BackupRestore from '@/components/settings/BackupRestore';
import { useThemeStore } from '@/stores/themeStore';
import { useCurrencyStore } from '@/stores/currencyStore';

export default function SettingsPage() {
  const { user } = useRequireAuth();
  const { theme, resolvedTheme } = useThemeStore();
  const { currency } = useCurrencyStore();

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Configuración ⚙️
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personaliza tu experiencia y gestiona tu cuenta
        </p>
      </div>

      {/* Estado actual */}
      <Card variant="gradient" className="mb-6">
        <CardBody className="!p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-800 dark:text-gray-300 font-medium">Tema:</span>
              <span className="font-bold text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded">
                {theme === 'system' ? `Sistema (${resolvedTheme})` : theme}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-800 dark:text-gray-300 font-medium">Moneda:</span>
              <span className="font-bold text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded">
                {currency.name} ({currency.code})
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Contenido */}
      <div className="space-y-6">
        {/* Perfil de usuario */}
        <UserProfile user={user} />

        {/* Grid de configuraciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cambiar PIN */}
          <ChangePinForm />

          {/* Moneda */}
          <CurrencySettings />

          {/* Tema */}
          <ThemeSettings />

          {/* Backup y Restore */}
          <div className="lg:col-span-2">
            <BackupRestore />
          </div>
        </div>

        {/* Información de la app */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default" className="text-center">
            <CardBody>
              <div className="text-3xl mb-2">🚀</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                Versión
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">1.0.0</p>
            </CardBody>
          </Card>

          <Card variant="default" className="text-center">
            <CardBody>
              <div className="text-3xl mb-2">💾</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                Tecnología
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SQLite WASM
              </p>
            </CardBody>
          </Card>

          <Card variant="default" className="text-center">
            <CardBody>
              <div className="text-3xl mb-2">🔒</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                Privacidad
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                100% Offline
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Acerca de */}
        <Card variant="gradient">
          <CardBody>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Acerca de Finora Balance
            </h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>Finora Balance</strong> es una aplicación de gestión
                financiera personal que funciona 100% en tu navegador, sin
                necesidad de conexión a internet ni servidores externos.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                    🎯 Características
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li>✓ Base de datos SQLite local</li>
                    <li>✓ Encriptación de PIN (PBKDF2)</li>
                    <li>✓ Gráficos interactivos</li>
                    <li>✓ Exportar/Importar datos</li>
                    <li>✓ Categorías personalizables</li>
                    <li>✓ Reportes detallados</li>
                    <li>✓ Tema claro/oscuro</li>
                    <li>✓ Múltiples monedas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                    🔐 Seguridad
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li>✓ Datos solo en tu dispositivo</li>
                    <li>✓ Sin envío de información</li>
                    <li>✓ PIN hasheado con salt</li>
                    <li>✓ Backup local</li>
                    <li>✓ Sin tracking ni analytics</li>
                    <li>✓ Código abierto</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Soporte */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>¿Necesitas ayuda?</strong> Esta aplicación es de código
            abierto y funciona completamente offline. Para reportar problemas o
            sugerencias, visita el repositorio del proyecto.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}