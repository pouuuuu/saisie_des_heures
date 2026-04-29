'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * HeureCard - Affiche une entrée d'heure
 *
 * Fonctionnalités:
 * - Design minimaliste mobile-first
 * - Indicateur de statut (couleur)
 * - Badge pour le type (MO, FRAIS)
 * - Actions (éditer, supprimer)
 * - Responsive (card simple, mais scalable)
 *
 * Utilisation:
 * ```tsx
 * <HeureCard
 *   heure={heure}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */

export interface Heure {
  id: string;
  chantier_id: string;
  chantierName?: string; // À passer depuis le parent
  date: Date | string;
  hours: number;
  type: 'MO' | 'FRAIS';
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SYNCED';
  notes?: string;
}

interface HeureCardProps {
  heure: Heure;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function HeureCard({ heure, onEdit, onDelete }: HeureCardProps) {
  // Formatage de la date
  const dateObj = typeof heure.date === 'string' ? new Date(heure.date) : heure.date;
  const formattedDate = format(dateObj, 'EEEE d MMMM', { locale: fr });
  const dayOfWeek = format(dateObj, 'EEEE', { locale: fr }).charAt(0).toUpperCase() +
    format(dateObj, 'EEEE', { locale: fr }).slice(1);

  // Couleur de l'indicateur de statut
  const statusColors = {
    DRAFT: 'bg-gray-200',
    PENDING: 'bg-yellow-200',
    APPROVED: 'bg-green-200',
    REJECTED: 'bg-red-200',
    SYNCED: 'bg-blue-200',
  };

  const statusLabels = {
    DRAFT: 'Brouillon',
    PENDING: 'En attente',
    APPROVED: 'Validée',
    REJECTED: 'Rejetée',
    SYNCED: 'Synchronisée',
  };

  // Type badge
  const typeLabel = heure.type === 'MO' ? '👨‍💼 Travail' : '🚗 Frais';
  const typeBgColor = heure.type === 'MO' ? 'bg-blue-100' : 'bg-orange-100';
  const typeTextColor = heure.type === 'MO' ? 'text-blue-700' : 'text-orange-700';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Indicateur de statut (top border) */}
      <div className={`h-1 ${statusColors[heure.status]}`} />

      {/* Contenu principal */}
      <div className="p-4">
        {/* Header: Chantier + Date */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base">
              {heure.chantierName || 'Chantier non spécifié'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {dayOfWeek} {format(dateObj, 'd MMM', { locale: fr })}
            </p>
          </div>
          {/* Heures en gros */}
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-blue-600">{heure.hours}</div>
            <div className="text-xs text-gray-500">heures</div>
          </div>
        </div>

        {/* Tags: Type + Statut */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Type badge */}
          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${typeBgColor} ${typeTextColor}`}>
            {typeLabel}
          </span>

          {/* Statut badge */}
          <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
            {statusLabels[heure.status]}
          </span>
        </div>

        {/* Notes (si présentes) */}
        {heure.notes && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-3">
            {heure.notes}
          </p>
        )}

        {/* Actions (edit, delete) */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={() => onEdit(heure.id)}
              className="flex-1 py-2 px-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition min-h-touch"
            >
              ✏️ Éditer
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(heure.id)}
              className="flex-1 py-2 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition min-h-touch"
            >
              🗑️ Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
