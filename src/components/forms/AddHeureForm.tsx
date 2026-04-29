'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

/**
 * AddHeureForm - Formulaire pour ajouter/éditer une heure
 *
 * Fonctionnalités:
 * - Mobile-first (tous les inputs en fullwidth)
 * - Validation basique
 * - Chargement de chantiers depuis API
 * - Sélecteur date custom (input date HTML5 amélioré)
 * - Boutons Cancel/Submit
 *
 * Utilisation:
 * ```tsx
 * <AddHeureForm
 *   onSubmit={async (data) => {...}}
 *   onCancel={close}
 *   isLoading={false}
 * />
 * ```
 */

export interface AddHeureFormData {
  chantier_id: string;
  date: string; // YYYY-MM-DD
  hours: number;
  type: 'MO' | 'FRAIS';
  notes?: string;
  user_id?: string; // Pour les chefs/RH qui saisissent pour d'autres
}

interface Chantier {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface AddHeureFormProps {
  onSubmit: (data: AddHeureFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: Partial<AddHeureFormData>;
  showUserSelect?: boolean; // Afficher le sélecteur d'utilisateur
  users?: User[]; // Liste des utilisateurs (pour chefs/RH)
  usersLoading?: boolean;
}

export function AddHeureForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  showUserSelect = false,
  users = [],
  usersLoading = false,
}: AddHeureFormProps) {
  // Form state
  const [formData, setFormData] = useState<AddHeureFormData>({
    chantier_id: initialData?.chantier_id || '',
    date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
    hours: initialData?.hours || 8,
    type: initialData?.type || 'MO',
    notes: initialData?.notes || '',
    user_id: initialData?.user_id || (users.length > 0 ? users[0].id : ''),
  });

  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [chantierLoading, setChantierLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Charger les chantiers
  useEffect(() => {
    const fetchChantiers = async () => {
      try {
        setChantierLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/chantiers', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setChantiers(data.chantiers || []);

          // Si pas de chantier sélectionné, sélectionner le premier
          if (!formData.chantier_id && data.chantiers?.length > 0) {
            setFormData(prev => ({
              ...prev,
              chantier_id: data.chantiers[0].id,
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching chantiers:', err);
        setError('Erreur lors du chargement des chantiers');
      } finally {
        setChantierLoading(false);
      }
    };

    fetchChantiers();
  }, []);

  // Validation basique
  const validate = (): boolean => {
    if (showUserSelect && !formData.user_id) {
      setError('Veuillez sélectionner un employé');
      return false;
    }
    if (!formData.chantier_id) {
      setError('Veuillez sélectionner un chantier');
      return false;
    }
    if (!formData.date) {
      setError('Veuillez sélectionner une date');
      return false;
    }
    if (formData.hours <= 0 || formData.hours > 24) {
      setError('Les heures doivent être entre 0.5 et 24');
      return false;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setError('La date ne peut pas être dans le futur');
      return false;
    }

    setError('');
    return true;
  };

  // Gestion de la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setSubmitError(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Gestion des changements
  const handleChange = (
    field: keyof AddHeureFormData,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'hours' ? Number(value) : value,
    }));
    // Effacer l'erreur quand l'utilisateur modifie
    if (error) setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Sélecteur d'employé (pour chefs/RH) */}
      {showUserSelect && (
        <div>
          <label htmlFor="user" className="block text-sm font-semibold text-gray-900 mb-2">
            👤 Employé <span className="text-red-500">*</span>
          </label>
          {usersLoading ? (
            <div className="p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
              Chargement des employés...
            </div>
          ) : users.length === 0 ? (
            <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600 border border-red-200">
              ❌ Aucun employé disponible
            </div>
          ) : (
            <select
              id="user"
              value={formData.user_id || ''}
              onChange={(e) => handleChange('user_id', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
            >
              <option value="">-- Sélectionner un employé --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Chantier */}
      <div>
        <label htmlFor="chantier" className="block text-sm font-semibold text-gray-900 mb-2">
          📍 Chantier <span className="text-red-500">*</span>
        </label>
        {chantierLoading ? (
          <div className="p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
            Chargement des chantiers...
          </div>
        ) : chantiers.length === 0 ? (
          <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600 border border-red-200">
            ❌ Aucun chantier disponible
          </div>
        ) : (
          <select
            id="chantier"
            value={formData.chantier_id}
            onChange={(e) => handleChange('chantier_id', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
          >
            <option value="">-- Sélectionner un chantier --</option>
            {chantiers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-semibold text-gray-900 mb-2">
          📅 Date <span className="text-red-500">*</span>
        </label>
        <input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')} // Pas de date future
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
        />
        <p className="text-xs text-gray-500 mt-1">
          Aujourd'hui: {format(new Date(), 'EEEE d MMMM yyyy')}
        </p>
      </div>

      {/* Heures */}
      <div>
        <label htmlFor="hours" className="block text-sm font-semibold text-gray-900 mb-2">
          ⏱️ Heures <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="hours"
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            value={formData.hours}
            onChange={(e) => handleChange('hours', e.target.value)}
            placeholder="8"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
            inputMode="decimal"
          />
          <span className="absolute right-4 top-3 text-gray-600 font-semibold text-lg">h</span>
        </div>
        <div className="flex gap-2 mt-2">
          {[4, 6, 8, 10].map(h => (
            <button
              key={h}
              type="button"
              onClick={() => handleChange('hours', h)}
              className="flex-1 px-2 py-2 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-100 transition min-h-touch"
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-semibold text-gray-900 mb-2">
          🏷️ Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <label className="flex-1 flex items-center px-4 py-3 border-2 rounded-lg cursor-pointer transition"
            style={{
              borderColor: formData.type === 'MO' ? '#3b82f6' : '#d1d5db',
              backgroundColor: formData.type === 'MO' ? '#eff6ff' : 'white',
            }}
          >
            <input
              type="radio"
              value="MO"
              checked={formData.type === 'MO'}
              onChange={(e) => handleChange('type', e.target.value)}
              className="mr-2"
            />
            <span className="font-medium text-gray-900">👨‍💼 Travail</span>
          </label>
          <label className="flex-1 flex items-center px-4 py-3 border-2 rounded-lg cursor-pointer transition"
            style={{
              borderColor: formData.type === 'FRAIS' ? '#f97316' : '#d1d5db',
              backgroundColor: formData.type === 'FRAIS' ? '#fff7ed' : 'white',
            }}
          >
            <input
              type="radio"
              value="FRAIS"
              checked={formData.type === 'FRAIS'}
              onChange={(e) => handleChange('type', e.target.value)}
              className="mr-2"
            />
            <span className="font-medium text-gray-900">🚗 Frais</span>
          </label>
        </div>
      </div>

      {/* Notes (optionnel) */}
      <div>
        <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
          📝 Notes (optionnel)
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Ex: Réunion client, déplacement..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base resize-none"
          rows={3}
        />
      </div>

      {/* Erreurs */}
      {(error || submitError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-900">
            ❌ {error || submitError}
          </p>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 min-h-touch"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || chantierLoading}
          className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 min-h-touch"
        >
          {isLoading ? '⏳ Enregistrement...' : '✅ Enregistrer'}
        </button>
      </div>
    </form>
  );
}
