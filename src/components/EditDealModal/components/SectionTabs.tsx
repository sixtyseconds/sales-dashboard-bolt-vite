import React, { useRef, useEffect } from 'react';

interface SectionTab {
  id: string;
  label: string;
}

interface SectionTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const SectionTabs: React.FC<SectionTabsProps> = ({ activeTab, onTabChange }) => {
  const tabsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  
  const tabs: SectionTab[] = [
    { id: 'details', label: 'Deal Details' },
    { id: 'stage', label: 'Pipeline Stage' },
    { id: 'source', label: 'Lead Source' },
    { id: 'activity', label: 'Activity' }
  ];
  
  // Focus active tab when it changes
  useEffect(() => {
    if (activeTab) {
      setTimeout(() => {
        const activeTabElement = tabsRef.current.get(activeTab);
        if (activeTabElement) {
          activeTabElement.focus();
        }
      }, 0);
    }
  }, [activeTab]);
  
  // Handle keyboard navigation for tabs
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    const tabsArray = Array.from(tabsRef.current.values());
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < tabs.length - 1) {
          const nextTab = tabs[currentIndex + 1];
          onTabChange(nextTab.id);
          tabsRef.current.get(nextTab.id)?.focus();
        }
        break;
      
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          const prevTab = tabs[currentIndex - 1];
          onTabChange(prevTab.id);
          tabsRef.current.get(prevTab.id)?.focus();
        }
        break;
      
      case 'Home':
        e.preventDefault();
        const firstTab = tabs[0];
        onTabChange(firstTab.id);
        tabsRef.current.get(firstTab.id)?.focus();
        break;
      
      case 'End':
        e.preventDefault();
        const lastTab = tabs[tabs.length - 1];
        onTabChange(lastTab.id);
        tabsRef.current.get(lastTab.id)?.focus();
        break;
      
      default:
        break;
    }
  };

  return (
    <div 
      role="tablist" 
      aria-label="Deal sections"
      className="flex px-6"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-section`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-inset ${
            activeTab === tab.id
              ? 'text-white border-violet-500'
              : 'text-gray-400 hover:text-gray-300 border-transparent hover:border-gray-700'
          }`}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          ref={(el) => {
            if (el) tabsRef.current.set(tab.id, el);
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SectionTabs; 