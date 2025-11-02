import React from 'react';
import { Tab } from '../../types';
import SparklesIcon from '../icons/SparklesIcon';
import FileIcon from '../icons/FileIcon';
import CalendarIcon from '../icons/CalendarIcon';
import LinkIcon from '../icons/LinkIcon';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'ai', name: 'AI', icon: SparklesIcon },
    { id: 'files', name: 'Files', icon: FileIcon },
    { id: 'reminders', name: 'Reminders', icon: CalendarIcon },
    { id: 'events', name: 'Events', icon: LinkIcon },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="md:hidden sticky bottom-0 left-0 right-0 bg-slate-100/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-slate-200/50 dark:border-gray-700/50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as Tab)}
            className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors duration-200 ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300'
            }`}
             aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{tab.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
