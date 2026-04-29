'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * Page: Profil
 *
 * Affiche les informations du profil utilisateur
 */
export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUser();
    }
  }, []);

  if (loading) {
    return <LoadingSpinner text="Chargement du profil..." fullScreen />;
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-red-600">Erreur lors du chargement du profil</p>
      </div>
    );
  }

  const roleLabels = {
    WORKER: '👨‍💼 Ouvrier',
    TEAM_LEAD: '👨‍💼 Chef de chantier',
    HR: '👩‍💼 RH',
    ADMIN: '⚙️ Administrateur',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">👤 Mon profil</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        {/* Informations */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</p>
            <p className="text-lg font-medium text-gray-900 mt-1">
              {roleLabels[user.role as keyof typeof roleLabels]}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p>
            <p className="text-lg font-medium text-gray-900 mt-1">{user.email}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Membre depuis
            </p>
            <p className="text-lg font-medium text-gray-900 mt-1">
              {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {user.active === false && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-700">
                ⚠️ Votre compte est désactivé. Contactez l'administrateur.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-6 flex gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('accessToken');
              router.push('/login');
            }}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition min-h-touch"
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Infos développeur */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-300">
        <p className="text-xs font-mono text-gray-700">
          <strong>User ID:</strong> {user.id}
          <br />
          <strong>Client ID:</strong> {user.client_id}
        </p>
      </div>
    </div>
  );
}
