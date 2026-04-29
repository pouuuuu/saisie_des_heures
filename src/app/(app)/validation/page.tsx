'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface Heure {
  id: string;
  user_id: string;
  date: string;
  hours: number;
  status: string;
  type: string;
  notes?: string;
  chantier: {
    name: string;
    code: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ValidationPage() {
  const [heures, setHeures] = useState<Heure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchHeures();
  }, []);

  const fetchHeures = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/validation', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des heures');
      }

      const data = await response.json();
      setHeures(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (heureId: string) => {
    setActionLoading(heureId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/validation/${heureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'approbation');
      }

      // Remove from list
      setHeures(heures.filter((h) => h.id !== heureId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (heureId: string) => {
    setActionLoading(heureId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/validation/${heureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du rejet');
      }

      // Remove from list
      setHeures(heures.filter((h) => h.id !== heureId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des heures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Erreur</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-8 h-8" />
          Validation des Heures
        </h1>
        <p className="text-gray-600 mt-2">{heures.length} entrée{heures.length !== 1 ? 's' : ''} en attente</p>
      </div>

      {heures.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-gray-600">Toutes les heures sont validées !</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {heures.map((heure) => (
            <div key={heure.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold text-gray-900">{heure.user.name}</p>
                  <p className="text-sm text-gray-600">{heure.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{heure.hours}h</p>
                  <p className="text-xs text-gray-600">
                    {new Date(heure.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{heure.chantier.name}</span>
                  <span className="text-gray-500"> ({heure.chantier.code})</span>
                </p>
                {heure.notes && <p className="text-sm text-gray-600 mt-1">{heure.notes}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(heure.id)}
                  disabled={actionLoading === heure.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {actionLoading === heure.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Approuver
                </button>
                <button
                  onClick={() => handleReject(heure.id)}
                  disabled={actionLoading === heure.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {actionLoading === heure.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
