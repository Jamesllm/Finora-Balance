/**
 * TransactionForm Component
 * Formulario para crear/editar transacciones
 */

'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Select, Card, CardHeader, CardBody } from '@/components/ui';
import { useCategories } from '@/hooks/useCategories';
import { CreateTransactionDTO, Transaction, TransactionType } from '@/types/database.types';

interface TransactionFormProps {
  userId: number;
  transaction?: Transaction | null;
  onSubmit: (data: CreateTransactionDTO) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function TransactionForm({
  userId,
  transaction,
  onSubmit,
  onCancel,
  isLoading = false,
}: TransactionFormProps) {
  const { incomeCategories, expenseCategories } = useCategories({ userId, autoLoad: true });

  const [formData, setFormData] = useState({
    amount: transaction?.amount.toString() || '',
    type: transaction?.type || 'expense' as TransactionType,
    category_id: transaction?.category_id.toString() || '',
    description: transaction?.description || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Actualizar categorías disponibles cuando cambia el tipo
  useEffect(() => {
    if (formData.type && !formData.category_id) {
      const categories = formData.type === 'income' ? incomeCategories : expenseCategories;
      if (categories.length > 0) {
        setFormData(prev => ({ ...prev, category_id: categories[0].id.toString() }));
      }
    }
  }, [formData.type, incomeCategories, expenseCategories, formData.category_id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar monto
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    // Validar categoría
    if (!formData.category_id) {
      newErrors.category_id = 'Debes seleccionar una categoría';
    }

    // Validar fecha
    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const transactionData: CreateTransactionDTO = {
      amount: parseFloat(formData.amount),
      type: formData.type,
      category_id: parseInt(formData.category_id),
      description: formData.description.trim() || null,
      date: formData.date,
      user_id: userId,
    };

    await onSubmit(transactionData);
  };

  const handleAmountChange = (value: string) => {
    // Solo permitir números y punto decimal
    const sanitized = value.replace(/[^\d.]/g, '');
    // Evitar múltiples puntos
    const parts = sanitized.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;

    setFormData(prev => ({ ...prev, amount: formatted }));

    // Limpiar error si el valor es válido
    if (parseFloat(formatted) > 0) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const currentCategories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const categoryOptions = currentCategories.map(cat => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  return (
    <Card variant="elevated">
      <CardHeader
        title={transaction ? 'Editar Transacción' : 'Nueva Transacción'}
        subtitle={transaction ? 'Modifica los datos de la transacción' : 'Registra un ingreso o gasto'}
        icon={
          <div className={`p-2 rounded-lg ${formData.type === 'income' ? 'bg-green-100' : 'bg-red-100'
            }`}>
            <span className="text-2xl">{formData.type === 'income' ? '📈' : '📉'}</span>
          </div>
        }
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de transacción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de transacción
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'income', category_id: '' }))}
                className={`p-4 rounded-lg border-2 transition-all ${formData.type === 'income'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-3xl mb-2">📈</div>
                <div className="font-semibold text-gray-800">Ingreso</div>
                <div className="text-xs text-gray-500">Dinero que recibes</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category_id: '' }))}
                className={`p-4 rounded-lg border-2 transition-all ${formData.type === 'expense'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-3xl mb-2">📉</div>
                <div className="font-semibold text-gray-800">Gasto</div>
                <div className="text-xs text-gray-500">Dinero que gastas</div>
              </button>
            </div>
          </div>

          {/* Monto */}
          <Input
            label="Monto"
            type="text"
            inputMode="decimal"
            value={formData.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            leftIcon={<span className="text-gray-600 font-semibold">$</span>}
            error={errors.amount}
            fullWidth
            required
          />

          {/* Categoría */}
          <Select
            label="Categoría"
            value={formData.category_id}
            onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
            options={categoryOptions}
            placeholder="Selecciona una categoría"
            error={errors.category_id}
            fullWidth
            required
          />

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ej: Compra de supermercado, pago de luz, etc."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/200 caracteres
            </p>
          </div>

          {/* Fecha */}
          <Input
            label="Fecha"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            error={errors.date}
            max={new Date().toISOString().split('T')[0]}
            fullWidth
            required
          />

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
                fullWidth
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              variant={formData.type === 'income' ? 'success' : 'primary'}
              loading={isLoading}
              fullWidth
            >
              {transaction ? 'Actualizar' : 'Guardar'} Transacción
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}