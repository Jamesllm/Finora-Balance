/**
 * Transactions Page
 * Página principal de gestión de transacciones
 */

'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Modal, Badge } from '@/components/ui';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import { transactionRepository } from '@/repositories';
import { Transaction, CreateTransactionDTO, TransactionFilters as FilterType } from '@/types/database.types';
import { useCurrency } from '@/hooks/useCurrency';

export default function TransactionsPage() {
  const { user } = useRequireAuth();
  const { formatAmount } = useCurrency();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState<FilterType>({});

  // Cargar transacciones
  const loadTransactions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = Object.keys(filters).length > 0
        ? await transactionRepository.findWithFilters(user.id, filters)
        : await transactionRepository.findByUserId(user.id);

      // Enriquecer con datos de categoría
      const enriched = await Promise.all(
        data.map(async (t) => {
          const category = await transactionRepository.executeQuerySingle(
            'SELECT name, icon, color FROM categories WHERE id = ?',
            [t.category_id]
          );
          return {
            ...t,
            category_name: category?.name || 'Sin categoría',
            category_icon: category?.icon || 'Package',
            category_color: category?.color || '#6B7280',
          };
        })
      );

      setTransactions(enriched);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user, filters]);

  // Crear transacción
  const handleCreate = async (data: CreateTransactionDTO) => {
    setIsSaving(true);
    try {
      await transactionRepository.create(data);
      await loadTransactions();
      setModalOpen(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error al crear la transacción');
    } finally {
      setIsSaving(false);
    }
  };

  // Actualizar transacción
  const handleUpdate = async (data: CreateTransactionDTO) => {
    if (!editingTransaction) return;

    setIsSaving(true);
    try {
      await transactionRepository.update(editingTransaction.id, {
        amount: data.amount,
        type: data.type,
        category_id: data.category_id,
        description: data.description,
        date: data.date,
      });
      await loadTransactions();
      setEditingTransaction(null);
      setModalOpen(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error al actualizar la transacción');
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar transacción
  const handleDelete = async (id: number) => {
    try {
      await transactionRepository.delete(id);
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error al eliminar la transacción');
    }
  };

  // Abrir modal para editar
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTransaction(null);
  };

  // Calcular estadísticas
  const stats = transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.totalIncome += t.amount;
        acc.incomeCount++;
      } else {
        acc.totalExpense += t.amount;
        acc.expenseCount++;
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, incomeCount: 0, expenseCount: 0 }
  );

  const balance = stats.totalIncome - stats.totalExpense;

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Transacciones 💸
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tus ingresos y gastos
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon="➕"
          onClick={() => setModalOpen(true)}
        >
          Nueva Transacción
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 border border-transparent dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatAmount(stats.totalIncome)}
              </p>
            </div>
          </div>
          <Badge variant="success" size="sm">
            {stats.incomeCount} {stats.incomeCount === 1 ? 'ingreso' : 'ingresos'}
          </Badge>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 border border-transparent dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
              <span className="text-2xl">📉</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gastos</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatAmount(stats.totalExpense)}
              </p>
            </div>
          </div>
          <Badge variant="danger" size="sm">
            {stats.expenseCount} {stats.expenseCount === 1 ? 'gasto' : 'gastos'}
          </Badge>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 border border-transparent dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Balance</p>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {balance >= 0 ? '+' : '-'}{formatAmount(Math.abs(balance))}
              </p>
            </div>
          </div>
          <Badge variant={balance >= 0 ? 'success' : 'danger'} size="sm">
            {balance >= 0 ? 'Positivo' : 'Negativo'}
          </Badge>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 border border-transparent dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {transactions.length}
              </p>
            </div>
          </div>
          <Badge variant="primary" size="sm">
            {transactions.length === 1 ? 'transacción' : 'transacciones'}
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <TransactionFilters
          userId={user.id}
          currentFilters={filters}
          onFilterChange={setFilters}
        />
      </div>

      {/* Lista de transacciones */}
      <TransactionList
        transactions={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Modal de formulario */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        size="lg"
        showCloseButton={true}
      >
        <TransactionForm
          userId={user.id}
          transaction={editingTransaction}
          onSubmit={editingTransaction ? handleUpdate : handleCreate}
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </AppLayout>
  );
}