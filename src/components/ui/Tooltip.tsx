import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  content: React.ReactNode; // Content to display inside the tooltip
  children: React.ReactElement; // The element that triggers the tooltip on hover
  position?: 'top' | 'bottom' | 'left' | 'right'; // Optional position (defaults to top)
  className?: string; // Optional additional classes for the tooltip itself
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const targetRef = useRef<HTMLElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (children.ref && typeof children.ref !== 'string') {
        // If the child has its own ref, assign it to targetRef
        (targetRef as React.MutableRefObject<HTMLElement | null>).current = e.currentTarget as HTMLElement;
    }
    // Use getBoundingClientRect for positioning relative to the target element
    const rect = e.currentTarget.getBoundingClientRect();
    // Default to top position calculation
    let newX = rect.left + rect.width / 2;
    let newY = rect.top;

    // Adjust based on position prop (add more calculations for left/right/bottom as needed)
    if (position === 'bottom') {
        newY = rect.bottom;
    } else if (position === 'left') {
        newX = rect.left;
        newY = rect.top + rect.height / 2;
    } else if (position === 'right') {
        newX = rect.right;
        newY = rect.top + rect.height / 2;
    }

    setCoords({ x: newX, y: newY });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Clone the child element to attach hover listeners
  const triggerElement = React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    ref: targetRef // Assign ref for potential direct access if needed
  });

  // Use a portal to render the tooltip at the body level
  const tooltipContent = isVisible ? ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        // Adjust positioning based on coords and desired position prop
        // This example keeps the 'top' positioning logic from the original
        top: coords.y,
        left: coords.x,
        transform: 'translate(-50%, -100%)', // Adjust transform based on position
        zIndex: 9999,
        // Add transition for smoother appearance (optional)
        transition: 'opacity 0.2s ease-in-out',
        opacity: 1,
        // Add small margin to avoid direct overlap
        marginBottom: position === 'bottom' ? '8px' : '0',
        marginTop: position === 'top' ? '-8px' : '0',
        // Add similar adjustments for left/right margins
      }}
      // Base classes + optional className prop
      className={`bg-gray-900/95 text-white text-xs rounded-lg p-2 shadow-xl border border-gray-700/50 backdrop-blur-sm ${className ?? ''}`}
      // Prevent the tooltip itself from triggering mouse leave on the target
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={handleMouseLeave}
    >
      {content}
      {/* Arrow - adjust based on position */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-gray-700/50"></div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {triggerElement}
      {tooltipContent}
    </>
  );
};

export default Tooltip;