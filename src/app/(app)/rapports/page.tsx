'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Clock, Users, AlertCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  totalHours: number;
  pendingCount: number;
  heures: any[];
}

export default function RapportsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/equipe', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }

        const data = await response.json();
        setTeam(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  const totalHours = team.reduce((sum, member) => sum + member.totalHours, 0);
  const pendingCount = team.reduce((sum, member) => sum + member.pendingCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rapports...</p>
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
          <BarChart3 className="w-8 h-8" />
          Rapports & Statistiques
        </h1>
        <p className="text-gray-600 mt-2">Suivi global des heures - Ce mois</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total heures</p>
              <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Équipes</p>
              <p className="text-3xl font-bold text-gray-900">{team.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">À valider</p>
              <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Team Details */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Détail par personne</h2>
        </div>

        {team.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <p>Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Nom</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Heures</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">À valider</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">
                      {member.totalHours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4">
                      {member.pendingCount > 0 ? (
                        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                          {member.pendingCount}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
