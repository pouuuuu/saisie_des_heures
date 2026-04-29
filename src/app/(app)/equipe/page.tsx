'use client';

import { useEffect, useState } from 'react';
import { Users, Clock, AlertCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  totalHours: number;
  pendingCount: number;
  heures: any[];
}

export default function EquipePage() {
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
          throw new Error('Erreur lors de la récupération de l\'équipe');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'équipe...</p>
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
          <Users className="w-8 h-8" />
          Mon Équipe
        </h1>
        <p className="text-gray-600 mt-2">{team.length} membre{team.length !== 1 ? 's' : ''}</p>
      </div>

      {team.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun membre dans votre équipe</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {team.map((member) => (
            <div key={member.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
                {member.pendingCount > 0 && (
                  <div className="bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {member.pendingCount} à valider
                  </div>
                )}
              </div>

              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{member.totalHours.toFixed(1)} heures ce mois</span>
                </div>
              </div>

              {member.heures.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Dernières heures</p>
                  <div className="space-y-2">
                    {member.heures.slice(0, 3).map((heure, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex justify-between">
                        <span>
                          {new Date(heure.date).toLocaleDateString('fr-FR')} - {heure.chantier.name}
                        </span>
                        <span className="font-medium">{heure.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
