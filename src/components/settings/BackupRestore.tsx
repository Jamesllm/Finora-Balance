/**
 * BackupRestore Component
 * Exportar e importar base de datos
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody, Button } from '@/components/ui';
import { ConfirmModal } from '@/components/ui/Modal';
import { useDatabase } from '@/hooks/useDatabase';
import { getDatabaseSize } from '@/lib/indexeddb';

export default function BackupRestore() {
  const { exportDatabase, importDatabase, resetDatabase } = useDatabase();
  const [dbSize, setDbSize] = useState<number>(0);
  const [isLoadingSize, setIsLoadingSize] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar tamaño de DB al montar
  useState(() => {
    const loadSize = async () => {
      try {
        const size = await getDatabaseSize();
        setDbSize(size);
      } catch (error) {
        console.error('Error loading DB size:', error);
      } finally {
        setIsLoadingSize(false);
      }
    };
    loadSize();
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleExport = async () => {
    setIsExporting(true);
    setSuccessMessage('');

    try {
      await exportDatabase();
      setSuccessMessage('✓ Base de datos exportada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting database:', error);
      alert('Error al exportar la base de datos');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.db')) {
      alert('Por favor selecciona un archivo .db válido');
      return;
    }

    const confirmImport = confirm(
      '⚠️ ADVERTENCIA: Importar una base de datos reemplazará todos tus datos actuales. ¿Estás seguro?'
    );

    if (!confirmImport) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    setSuccessMessage('');

    try {
      await importDatabase(file);
      setSuccessMessage('✓ Base de datos importada exitosamente. Recargando...');

      // Recargar la página después de importar
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error importing database:', error);
      alert('Error al importar la base de datos. Verifica que el archivo sea válido.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    setIsResetting(true);

    try {
      await resetDatabase();
      setShowResetModal(false);
      setSuccessMessage('✓ Base de datos reiniciada. Recargando...');

      // Recargar la página después de reiniciar
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error) {
      console.error('Error resetting database:', error);
      alert('Error al reiniciar la base de datos');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Card variant="elevated">
        <CardHeader
          title="Backup y Restauración"
          subtitle="Exporta o importa tu base de datos"
          icon={
            <div className="bg-green-100 p-2 rounded-lg">
              <span className="text-2xl">💾</span>
            </div>
          }
        />
        <CardBody className="space-y-6">
          {/* Info de la DB */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Información de la Base de Datos</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tamaño:</span>
                <span className="font-semibold text-gray-800">
                  {isLoadingSize ? 'Calculando...' : formatBytes(dbSize)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ubicación:</span>
                <span className="font-semibold text-gray-800">IndexedDB (navegador)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-semibold text-gray-800">SQLite (WASM)</span>
              </div>
            </div>
          </div>

          {/* Exportar */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">📤 Exportar Backup</h4>
            <p className="text-sm text-gray-600 mb-3">
              Descarga una copia de seguridad de toda tu información en formato .db
            </p>
            <Button
              variant="primary"
              onClick={handleExport}
              loading={isExporting}
              disabled={isExporting}
              icon="💾"
              fullWidth
            >
              Descargar Backup
            </Button>
          </div>

          {/* Importar */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">📥 Importar Backup</h4>
            <p className="text-sm text-gray-600 mb-3">
              Restaura tu información desde un archivo .db previamente exportado
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".db"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file">
                <Button
                  variant="secondary"
                  disabled={isImporting}
                  icon="📁"
                  fullWidth
                >
                  {isImporting ? 'Importando...' : 'Seleccionar Archivo .db'}
                </Button>
              </label>
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              ⚠️ Importar reemplazará todos tus datos actuales
            </p>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Zona de peligro */}
          <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
            <h4 className="font-semibold text-red-900 mb-2">⚠️ Zona de Peligro</h4>
            <p className="text-sm text-red-800 mb-3">
              Reiniciar la base de datos eliminará TODOS tus datos permanentemente. Esta acción no se puede deshacer.
            </p>
            <Button
              variant="danger"
              onClick={() => setShowResetModal(true)}
              icon="🗑️"
              fullWidth
            >
              Reiniciar Base de Datos
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 Recomendaciones</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Exporta backups regularmente (semanal o mensualmente)</li>
              <li>• Guarda los backups en un lugar seguro (Google Drive, Dropbox, etc.)</li>
              <li>• Nombra los backups con la fecha: finora-2024-01-15.db</li>
              <li>• Verifica que puedes importar el backup antes de eliminar datos</li>
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Modal de confirmación de reset */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="¿Reiniciar Base de Datos?"
        message="Esta acción eliminará TODOS tus datos permanentemente: transacciones, categorías, configuración y todo lo demás. No se puede deshacer. ¿Estás absolutamente seguro?"
        variant="danger"
        confirmText="Sí, eliminar todo"
        cancelText="Cancelar"
        isLoading={isResetting}
      />
    </>
  );
}