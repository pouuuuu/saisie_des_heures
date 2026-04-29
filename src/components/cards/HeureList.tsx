'use client';

import React, { useMemo } from 'react';
import { HeureCard, type Heure } from './HeureCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

/**
 * HeureList - Liste les heures avec groupement par jour/semaine
 *
 * Fonctionnalités:
 * - Groupement par jour par défaut
 * - Affichage du total journalier
 * - Loading state
 * - Empty state avec action
 * - Responsive grid
 *
 * Utilisation:
 * ```tsx
 * <HeureList
 *   heures={heures}
 *   loading={loading}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onAddClick={openSheet}
 * />
 * ```
 */

interface HeureListProps {
  heures: (Heure & { chantierName?: string })[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddClick?: () => void;
}

export function HeureList({
  heures,
  loading = false,
  onEdit,
  onDelete,
  onAddClick,
}: HeureListProps) {
  // Grouper les heures par jour
  const groupedByDay = useMemo(() => {
    const groups: { [key: string]: (Heure & { chantierName?: string })[] } = {};

    heures.forEach(heure => {
      const dateObj = typeof heure.date === 'string' ? new Date(heure.date) : heure.date;
      const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(heure);
    });

    // Trier par date décroissante
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        heures: items,
        totalHours: items.reduce((sum, h) => sum + h.hours, 0),
      }));
  }, [heures]);

  if (loading) {
    return <LoadingSpinner text="Chargement de vos heures..." />;
  }

  if (heures.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="Aucune heure enregistrée"
        description="Commencez par ajouter votre première heure de travail"
        action={
          onAddClick
            ? {
              label: '➕ Ajouter une heure',
              onClick: onAddClick,
            }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé des heures */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="text-sm font-medium text-blue-700 mb-1">
          Total du mois
        </div>
        <div className="text-3xl font-bold text-blue-900">
          {heures.reduce((sum, h) => sum + h.hours, 0)} h
        </div>
        <div className="text-xs text-blue-600 mt-1">
          {heures.length} enregistrement{heures.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Heures groupées par jour */}
      <div className="space-y-4">
        {groupedByDay.map(({ date, heures: dayHeures, totalHours }) => {
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          return (
            <div key={date}>
              {/* Header du jour avec total */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-gray-900">
                  {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                </h3>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {totalHours} h
                </span>
              </div>

              {/* Cartes des heures pour ce jour */}
              <div className="space-y-3">
                {dayHeures.map(heure => (
                  <HeureCard
                    key={heure.id}
                    heure={heure}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton "Ajouter une heure" flottant (si disponible) */}
      {onAddClick && (
        <div className="sticky bottom-20 md:bottom-4 right-4 flex justify-end">
          <button
            onClick={onAddClick}
            className="
              bg-blue-600 hover:bg-blue-700 text-white rounded-full
              p-4 shadow-lg hover:shadow-xl transition min-h-touch
              flex items-center justify-center w-14 h-14
            "
            aria-label="Ajouter une heure"
          >
            <span className="text-2xl">➕</span>
          </button>
        </div>
      )}
    </div>
  );
}
