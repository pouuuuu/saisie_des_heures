import { useState, useCallback, useEffect } from 'react';
import type { Heure } from '@/types';

/**
 * useHeures - Hook pour fetch et mutation des heures
 *
 * Fonctionnalités:
 * - Fetch les heures avec filtres
 * - Crée une nouvelle heure
 * - Modifie une heure existante
 * - Supprime une heure
 * - Gestion du loading et erreurs
 *
 * Utilisation:
 * ```ts
 * const { heures, loading, error, createHeure } = useHeures({
 *   filter: { userId: currentUserId }
 * });
 *
 * await createHeure({
 *   chantier_id: '...',
 *   date: '2024-11-24',
 *   hours: 8.5,
 *   type: 'MO'
 * });
 * ```
 */

interface UseHeuresOptions {
  filter?: {
    userId?: string;
    chantier_id?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  autoFetch?: boolean;
}

interface CreateHeureData {
  chantier_id: string;
  date: string; // YYYY-MM-DD
  hours: number;
  type: 'MO' | 'FRAIS';
  notes?: string;
  user_id?: string; // Pour les chefs/RH qui saisissent pour d'autres
}

export function useHeures(options: UseHeuresOptions = {}) {
  const { filter = {}, autoFetch = true } = options;

  const [heures, setHeures] = useState<Heure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch les heures
  const fetchHeures = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      // Construire les query params
      const params = new URLSearchParams();
      if (filter.userId) params.append('userId', filter.userId);
      if (filter.chantier_id) params.append('chantierId', filter.chantier_id);
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);

      const queryString = params.toString();
      const url = `/api/heures${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch heures');
      }

      const data = await response.json();
      setHeures(data.heures || []);
    } catch (err: any) {
      setError(err.message);
      setHeures([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch au montage ou quand filter change
  useEffect(() => {
    if (autoFetch) {
      fetchHeures();
    }
  }, [autoFetch, fetchHeures]);

  // Créer une heure
  const createHeure = useCallback(
    async (data: CreateHeureData) => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch('/api/heures', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create heure');
        }

        const result = await response.json();

        // Ajouter à la liste locale
        setHeures(prev => [...prev, result.heure]);

        return result.heure;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  // Mettre à jour une heure
  const updateHeure = useCallback(
    async (id: string, data: Partial<CreateHeureData>) => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`/api/heures/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update heure');
        }

        const result = await response.json();

        // Mettre à jour dans la liste locale
        setHeures(prev =>
          prev.map(h => (h.id === id ? result.heure : h))
        );

        return result.heure;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  // Supprimer une heure
  const deleteHeure = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/heures/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete heure');
      }

      // Retirer de la liste locale
      setHeures(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    heures,
    loading,
    error,
    fetchHeures,
    createHeure,
    updateHeure,
    deleteHeure,
  };
}
