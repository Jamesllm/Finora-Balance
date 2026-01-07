/**
 * TransactionList Component
 * Lista de transacciones con acciones
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody, Badge, Button } from '@/components/ui';
import { ConfirmModal } from '@/components/ui/Modal';
import { Transaction } from '@/types/database.types';
import { useCurrency } from '@/hooks/useCurrency';
import { CategoryIcon } from '@/components/CategoryIcon';

interface TransactionListProps {
  transactions: Array<Transaction & { category_name: string; category_icon: string; category_color: string }>;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
}

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
  isLoading = false,
}: TransactionListProps) {
  const { formatAmount } = useCurrency();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedId === null) return;

    setDeleting(true);
    try {
      await onDelete(selectedId);
      setDeleteModalOpen(false);
      setSelectedId(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardBody>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando transacciones...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card variant="elevated">
        <CardBody>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No hay transacciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Crea tu primera transacción para comenzar a llevar control de tus finanzas
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Agrupar por mes
  const groupedByMonth = transactions.reduce((acc, transaction) => {
    const month = new Date(transaction.date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
    });

    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(transaction);
    return acc;
  }, {} as Record<string, typeof transactions>);

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedByMonth).map(([month, monthTransactions]) => {
          const monthTotal = monthTransactions.reduce((sum, t) => {
            return sum + (t.type === 'income' ? t.amount : -t.amount);
          }, 0);

          return (
            <Card key={month} variant="elevated">
              <CardHeader
                title={month.charAt(0).toUpperCase() + month.slice(1)}
                subtitle={`${monthTransactions.length} transacciones`}
                action={
                  <div className="text-right">
                    <p className={`text-lg font-bold ${monthTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                      {monthTotal >= 0 ? '+' : '-'}{formatAmount(Math.abs(monthTotal))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Balance del mes</p>
                  </div>
                }
              />
              <CardBody className="space-y-2">
                {monthTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors group"
                  >
                    {/* Ícono de categoría */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: transaction.category_color + '20' }}
                    >
                      <CategoryIcon iconName={transaction.category_icon} color={transaction.category_color} className="w-6 h-6" />
                    </div>

                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {transaction.description || 'Sin descripción'}
                        </p>
                        <p
                          className={`text-lg font-bold whitespace-nowrap ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={transaction.type === 'income' ? 'success' : 'danger'}
                          size="sm"
                        >
                          {transaction.category_name}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(transaction)}
                        icon="✏️"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(transaction.id)}
                        icon="🗑️"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar transacción?"
        message="Esta acción no se puede deshacer. La transacción será eliminada permanentemente."
        variant="danger"
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isLoading={deleting}
      />
    </>
  );
}