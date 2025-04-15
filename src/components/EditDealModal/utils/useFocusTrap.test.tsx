import React, { useRef, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

// Test component for focus trapping
const FocusTrapTestComponent = ({ initialActive = false }) => {
  const [isActive, setIsActive] = useState(initialActive);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  
  // Apply the focus trap
  useFocusTrap(containerRef, isActive, initialFocusRef);
  
  return (
    <div>
      <button onClick={() => setIsActive(true)}>Activate Trap</button>
      
      <div ref={containerRef} data-testid="container">
        <button ref={initialFocusRef} data-testid="first">First Button</button>
        <button data-testid="middle">Middle Button</button>
        <button data-testid="last">Last Button</button>
      </div>
      
      <button data-testid="outside">Outside Button</button>
    </div>
  );
};

describe('useFocusTrap', () => {
  test('should set focus to initial element when activated', () => {
    render(<FocusTrapTestComponent initialActive={true} />);
    
    // Initial focus should be on the first button
    expect(document.activeElement).toBe(screen.getByTestId('first'));
  });
  
  test('should trap focus within container when tab is pressed', () => {
    render(<FocusTrapTestComponent initialActive={true} />);
    
    // Initial focus is on first button
    const firstButton = screen.getByTestId('first');
    const middleButton = screen.getByTestId('middle');
    const lastButton = screen.getByTestId('last');
    
    // Tab from first to middle
    fireEvent.keyDown(firstButton, { key: 'Tab' });
    expect(document.activeElement).toBe(middleButton);
    
    // Tab from middle to last
    fireEvent.keyDown(middleButton, { key: 'Tab' });
    expect(document.activeElement).toBe(lastButton);
    
    // Tab from last should cycle back to first
    fireEvent.keyDown(lastButton, { key: 'Tab' });
    expect(document.activeElement).toBe(firstButton);
  });
  
  test('should trap focus when shift+tab is pressed', () => {
    render(<FocusTrapTestComponent initialActive={true} />);
    
    // Initial focus is on first button
    const firstButton = screen.getByTestId('first');
    const middleButton = screen.getByTestId('middle');
    const lastButton = screen.getByTestId('last');
    
    // Shift+Tab from first should go to last
    fireEvent.keyDown(firstButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastButton);
    
    // Shift+Tab from last should go to middle
    fireEvent.keyDown(lastButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(middleButton);
    
    // Shift+Tab from middle should go to first
    fireEvent.keyDown(middleButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(firstButton);
  });
  
  test('should not trap focus when inactive', () => {
    render(<FocusTrapTestComponent initialActive={false} />);
    
    // Activate button should have focus initially (default behavior)
    const activateButton = screen.getByText('Activate Trap');
    expect(document.activeElement).toBe(document.body); // Default focus on body
    
    // Click outside button to focus it
    const outsideButton = screen.getByTestId('outside');
    outsideButton.focus();
    expect(document.activeElement).toBe(outsideButton);
    
    // Tab should work normally without trapping
    fireEvent.keyDown(outsideButton, { key: 'Tab' });
    // The default behavior would be complex to test without a real browser
    // so we're just verifying the focus isn't forced back inside
    expect(document.activeElement).not.toBe(screen.getByTestId('first'));
  });
}); 