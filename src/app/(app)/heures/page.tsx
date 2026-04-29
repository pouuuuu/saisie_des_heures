'use client';

import { useState, useEffect } from 'react';
import { useHeures } from '@/hooks/useHeures';
import { HeureList } from '@/components/cards/HeureList';
import { MobileSheet } from '@/components/layout/MobileSheet';
import { AddHeureForm } from '@/components/forms/AddHeureForm';
import { useMobileSheet } from '@/hooks/useMobileSheet';
import type { AddHeureFormData } from '@/components/forms/AddHeureForm';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthUser {
  role: string;
}

/**
 * Page: Mes heures
 *
 * Affiche la liste des heures de l'utilisateur connecté
 * Permet d'ajouter, éditer et supprimer des heures
 */

const fetchOptions = {autoFetch: true};

export default function HeuresPage() {
  const { heures, loading, error, createHeure, updateHeure, deleteHeure } = useHeures(fetchOptions);

  const { isOpen, open, close } = useMobileSheet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);

  // Fetch current user and workers list
  useEffect(() => {
    const fetchUserAndWorkers = async () => {
      try {
        const token = localStorage.getItem('accessToken');

        // Get current user from /api/auth/me
        const meResponse = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          setAuthUser(meData.user);

          // If team lead or HR, fetch workers
          if (meData.user.role === 'TEAM_LEAD' || meData.user.role === 'HR') {
            setWorkersLoading(true);
            try {
              const workersResponse = await fetch('/api/equipe/workers', {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (workersResponse.ok) {
                const workersData = await workersResponse.json();
                setWorkers(workersData.data || []);
              }
            } finally {
              setWorkersLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUserAndWorkers();
  }, []);

  // Récupérer les données de l'heure en édition (pour pré-remplir le formulaire)
  const editingHeure = editingId
    ? heures.find(h => h.id === editingId)
    : null;

  // Gestion de la soumission
  const handleSubmit = async (data: AddHeureFormData) => {
    setIsSubmitting(true);

    try {
      if (editingId) {
        // Mettre à jour une heure existante
        await updateHeure(editingId, data);
        toast.success('Heure mise à jour ✅');
        setEditingId(null);
      } else {
        // Créer une nouvelle heure
        await createHeure(data);
        toast.success('Heure enregistrée ✅');
      }

      close();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion de l'édition
  const handleEdit = (id: string) => {
    setEditingId(id);
    open();
  };

  // Gestion de la suppression
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette heure ?')) {
      return;
    }

    try {
      await deleteHeure(id);
      toast.success('Heure supprimée ✅');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  // Gestion de la fermeture du sheet
  const handleSheetClose = () => {
    setEditingId(null);
    close();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Mes heures</h1>
          <p className="text-gray-600 text-sm mt-1">
            {heures.length} enregistrement{heures.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Bouton ajouter (desktop) */}
        <button
          onClick={open}
          className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition min-h-touch"
        >
          ➕ Ajouter une heure
        </button>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Liste des heures */}
      <HeureList
        heures={heures}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddClick={open}
      />

      {/* Bottom sheet: Formulaire d'ajout/édition */}
      <MobileSheet
        isOpen={isOpen}
        onClose={handleSheetClose}
        title={editingId ? '✏️ Modifier l\'heure' : '➕ Ajouter une heure'}
        size="large"
      >
        <AddHeureForm
          onSubmit={handleSubmit}
          onCancel={handleSheetClose}
          isLoading={isSubmitting}
          showUserSelect={authUser && (authUser.role === 'TEAM_LEAD' || authUser.role === 'HR')}
          users={workers}
          usersLoading={workersLoading}
          initialData={
            editingHeure
              ? {
                chantier_id: editingHeure.chantier_id,
                date: typeof editingHeure.date === 'string'
                  ? editingHeure.date
                  : new Date(editingHeure.date).toISOString().split('T')[0],
                hours: editingHeure.hours,
                type: editingHeure.type as 'MO' | 'FRAIS',
                notes: editingHeure.notes,
              }
              : undefined
          }
        />
      </MobileSheet>
    </div>
  );
}
