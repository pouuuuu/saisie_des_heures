import { useState, useCallback, useEffect } from 'react';
import type { Chantier } from '@/types';

/**
 * useChantiers - Hook pour fetch les chantiers
 *
 * Fonctionnalités:
 * - Fetch la liste des chantiers accessibles
 * - Caching simple
 * - Gestion loading/error
 *
 * Utilisation:
 * ```ts
 * const { chantiers, loading, error } = useChantiers();
 * ```
 */

export function useChantiers() {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChantiers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/chantiers', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chantiers');
      }

      const data = await response.json();
      setChantiers(data.chantiers || []);
    } catch (err: any) {
      setError(err.message);
      setChantiers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch au montage
  useEffect(() => {
    fetchChantiers();
  }, [fetchChantiers]);

  return { chantiers, loading, error, refetch: fetchChantiers };
}
