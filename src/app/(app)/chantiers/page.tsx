'use client';

import { useChantiers } from '@/hooks/useChantiers';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

/**
 * Page: Chantiers
 *
 * Affiche la liste des chantiers disponibles pour l'utilisateur
 * (lecture seule pour les ouvriers)
 */
export default function ChantiersPage() {
  const { chantiers, loading, error } = useChantiers();

  if (loading) {
    return <LoadingSpinner text="Chargement des chantiers..." fullScreen />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🏗️ Chantiers</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {chantiers.length === 0 ? (
        <EmptyState
          icon="🏗️"
          title="Aucun chantier disponible"
          description="Contactez votre administrateur pour vous assigner des chantiers"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chantiers.map(chantier => (
            <div
              key={chantier.id}
              className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-900 text-lg">{chantier.name}</h3>
              <p className="text-sm text-gray-600 mt-1">Code: {chantier.code}</p>
              {chantier.description && (
                <p className="text-sm text-gray-600 mt-2">{chantier.description}</p>
              )}
              <div className="mt-4">
                <span
                  className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                    chantier.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {chantier.active ? '✅ Actif' : '⏸️ Inactif'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
