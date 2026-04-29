'use client';

/**
 * EmptyState - Affiche un message quand il n'y a pas de données
 *
 * Utilisation:
 * ```tsx
 * <EmptyState
 *   title="Aucune heure enregistrée"
 *   description="Commencez par ajouter votre première heure"
 *   icon="📊"
 *   action={{
 *     label: 'Ajouter une heure',
 *     onClick: openSheet
 *   }}
 * />
 * ```
 */

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="text-6xl mb-4">{icon}</div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-gray-600 text-sm max-w-sm mb-6">{description}</p>
      )}

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition min-h-touch"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
