import { useState, useCallback } from 'react';

/**
 * Hook pour gérer l'état d'un bottom sheet mobile
 *
 * Utilisation:
 * ```
 * const { isOpen, open, close } = useMobileSheet();
 * <MobileSheet isOpen={isOpen} onClose={close}>
 *   <AddHeureForm />
 * </MobileSheet>
 * ```
 */
export function useMobileSheet() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    // Empêcher scroll du body quand sheet est ouvert
    document.body.style.overflow = 'hidden';
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Restaurer scroll du body
    document.body.style.overflow = 'unset';
  }, []);

  return { isOpen, open, close };
}
