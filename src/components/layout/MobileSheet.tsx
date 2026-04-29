'use client';

import React, { useEffect, useRef } from 'react';

/**
 * MobileSheet - Bottom sheet réutilisable pour mobile
 *
 * Fonctionnalités:
 * - Apparition depuis le bas (animation smooth)
 * - Drag handle visible (UX iOS-like)
 * - Fermeture au clic extérieur ou sur handle
 * - Responsive (fullscreen sur petit écran)
 * - Gestion scroll correct
 *
 * Utilisation:
 * ```tsx
 * <MobileSheet isOpen={isOpen} onClose={close} title="Ajouter une heure">
 *   <AddHeureForm onSubmit={handleSubmit} onCancel={close} />
 * </MobileSheet>
 * ```
 */
interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large'; // medium = 60vh, large = 90vh
}

export function MobileSheet({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
}: MobileSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Gestion de l'échap pour fermer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Gestion du swipe down (fermeture)
  useEffect(() => {
    if (!contentRef.current || !isOpen) return;

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      currentY = startY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      // Seulement si on swipe vers le bas ET qu'on est en haut du contenu
      if (diff > 0 && contentRef.current!.scrollTop === 0) {
        contentRef.current!.style.transform = `translateY(${diff}px)`;
      }
    };

    const handleTouchEnd = () => {
      const diff = currentY - startY;
      // Si swipe > 100px, fermer le sheet
      if (diff > 100) {
        onClose();
      } else {
        // Sinon, réanimer vers le haut
        contentRef.current!.style.transform = 'translateY(0)';
      }
    };

    if (isOpen) {
      contentRef.current.addEventListener('touchstart', handleTouchStart);
      contentRef.current.addEventListener('touchmove', handleTouchMove);
      contentRef.current.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('touchstart', handleTouchStart);
        contentRef.current.removeEventListener('touchmove', handleTouchMove);
        contentRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Déterminer la hauteur basée sur `size`
  const heightClass = {
    small: 'max-h-96',
    medium: 'max-h-[60vh]',
    large: 'max-h-[90vh]',
  }[size];

  return (
    <>
      {/* Backdrop semi-transparent */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet content */}
      <div
        ref={contentRef}
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white rounded-t-2xl shadow-2xl
          overflow-y-auto overflow-x-hidden
          ${heightClass}
          transition-transform duration-300 ease-out
          transform translate-y-0
        `}
        style={{
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* Drag handle */}
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 flex justify-center border-b border-gray-200">
          <div
            className="w-12 h-1 bg-gray-300 rounded-full cursor-grab active:cursor-grabbing"
            role="button"
            tabIndex={0}
            aria-label="Drag to close"
          />
        </div>

        {/* Header with title */}
        {title && (
          <div className="px-4 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="p-4 pb-8">
          {children}
        </div>
      </div>
    </>
  );
}
