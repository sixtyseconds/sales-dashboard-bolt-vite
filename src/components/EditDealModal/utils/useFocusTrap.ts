import { useEffect, RefObject } from 'react';

/**
 * Custom hook to trap focus within a container, providing an accessible modal experience
 * 
 * This hook implements focus trapping which is essential for accessibility compliance,
 * particularly for modal dialogs. It ensures that keyboard navigation (Tab/Shift+Tab)
 * cannot leave the specified container while the trap is active.
 * 
 * Accessibility features:
 * - Traps keyboard focus within the container
 * - Maintains the focus loop between focusable elements
 * - Restores previous focus when the trap is deactivated
 * - Optionally sets initial focus on a specified element
 * 
 * @param containerRef - Reference to the container element to trap focus within
 * @param isActive - Whether the focus trap is active
 * @param initialFocusRef - Optional reference to the element that should receive focus when the trap activates
 * 
 * @example
 * ```tsx
 * const MyModal = ({ isOpen }) => {
 *   const modalRef = useRef<HTMLDivElement>(null);
 *   const initialFocusRef = useRef<HTMLButtonElement>(null);
 * 
 *   // Apply focus trap to modal when it's open
 *   useFocusTrap(modalRef, isOpen, initialFocusRef);
 * 
 *   return (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       <button ref={initialFocusRef}>This gets focus when modal opens</button>
 *       <button>Another focusable element</button>
 *       <button>Close</button>
 *     </div>
 *   );
 * };
 * ```
 */
export const useFocusTrap = (
  containerRef: RefObject<HTMLElement>,
  isActive: boolean,
  initialFocusRef?: RefObject<HTMLElement>
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the element that was focused before the trap was activated
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus the initial element if provided, otherwise the first focusable element
    const focusInitialElement = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusableElements = getFocusableElements(containerRef.current);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    // Set initial focus
    focusInitialElement();

    // Handle tab key to cycle through focusable elements
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // If Shift+Tab and focus is on first element, move to last element
      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } 
      // If Tab and focus is on last element, move to first element
      else if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    // Add event listener for keydown
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Remove event listener
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus when the trap is deactivated
      if (previouslyFocused && 'focus' in previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [isActive, containerRef, initialFocusRef]);
};

/**
 * Get all focusable elements within a container
 * 
 * This helper function finds all natively focusable elements within the container,
 * including elements with tabindex attributes. It returns them in DOM order.
 * 
 * @param container - The container element to search within
 * @returns An array of focusable HTML elements
 */
const getFocusableElements = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) return [];
  
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');
  
  return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
};

export default useFocusTrap; 