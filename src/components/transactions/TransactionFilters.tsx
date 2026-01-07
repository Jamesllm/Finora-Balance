/**
 * TransactionFilters Component
 * Filtros para la lista de transacciones
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, Select, Input, Button, Badge } from '@/components/ui';
import { useCategories } from '@/hooks/useCategories';
import { TransactionFilters as FilterType } from '@/types/database.types';

interface TransactionFiltersProps {
  userId: number;
  onFilterChange: (filters: FilterType) => void;
  currentFilters: FilterType;
}

export default function TransactionFilters({
  userId,
  onFilterChange,
  currentFilters,
}: TransactionFiltersProps) {
  const { categories } = useCategories({ userId, autoLoad: true });
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    const newFilters = { ...currentFilters, [key]: value || undefined };
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const activeFilterCount = Object.keys(currentFilters).filter(
    key => currentFilters[key as keyof FilterType] !== undefined
  ).length;

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map(cat => ({
      value: cat.id.toString(),
      label: cat.name,
    })),
  ];

  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'income', label: '📈 Ingresos' },
    { value: 'expense', label: '📉 Gastos' },
  ];

  // Fechas predefinidas
  const getPresetDates = () => {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    return {
      thisMonth: thisMonth.toISOString().split('T')[0],
      lastMonth: lastMonth.toISOString().split('T')[0],
      thisYear: thisYear.toISOString().split('T')[0],
      today: today.toISOString().split('T')[0],
    };
  };

  const presetDates = getPresetDates();

  const applyPreset = (preset: 'today' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const today = new Date().toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        handleFilterChange('start_date', today);
        handleFilterChange('end_date', today);
        break;
      case 'thisMonth':
        handleFilterChange('start_date', presetDates.thisMonth);
        handleFilterChange('end_date', today);
        break;
      case 'lastMonth':
        const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
        handleFilterChange('start_date', presetDates.lastMonth);
        handleFilterChange('end_date', lastMonthEnd.toISOString().split('T')[0]);
        break;
      case 'thisYear':
        handleFilterChange('start_date', presetDates.thisYear);
        handleFilterChange('end_date', today);
        break;
    }
  };

  return (
    <Card variant="bordered">
      <CardBody>
        {/* Header compacto */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Filtros</h3>
            {activeFilterCount > 0 && (
              <Badge variant="primary" size="sm">
                {activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▲ Ocultar' : '▼ Mostrar'}
            </Button>
          </div>
        </div>

        {/* Filtros rápidos (siempre visibles) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <Select
            options={typeOptions}
            value={currentFilters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            fullWidth
          />
          <Select
            options={categoryOptions}
            value={currentFilters.category_id?.toString() || ''}
            onChange={(e) => handleFilterChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
            fullWidth
          />
        </div>

        {/* Filtros avanzados (colapsables) */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
            {/* Presets de fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Períodos rápidos
              </label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => applyPreset('today')}>
                  Hoy
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyPreset('thisMonth')}>
                  Este mes
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyPreset('lastMonth')}>
                  Mes pasado
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyPreset('thisYear')}>
                  Este año
                </Button>
              </div>
            </div>

            {/* Rango de fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Desde"
                type="date"
                value={currentFilters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                max={currentFilters.end_date || new Date().toISOString().split('T')[0]}
                fullWidth
              />
              <Input
                label="Hasta"
                type="date"
                value={currentFilters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                min={currentFilters.start_date}
                max={new Date().toISOString().split('T')[0]}
                fullWidth
              />
            </div>

            {/* Rango de montos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Monto mínimo"
                type="number"
                placeholder="0.00"
                value={currentFilters.min_amount?.toString() || ''}
                onChange={(e) => handleFilterChange('min_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                leftIcon={<span className="text-gray-600 dark:text-gray-400">$</span>}
                min="0"
                step="0.01"
                fullWidth
              />
              <Input
                label="Monto máximo"
                type="number"
                placeholder="0.00"
                value={currentFilters.max_amount?.toString() || ''}
                onChange={(e) => handleFilterChange('max_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                leftIcon={<span className="text-gray-600 dark:text-gray-400">$</span>}
                min={currentFilters.min_amount || 0}
                step="0.01"
                fullWidth
              />
            </div>

            {/* Búsqueda por descripción */}
            <Input
              label="Buscar en descripción"
              type="text"
              placeholder="Buscar..."
              value={currentFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon={
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              fullWidth
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}