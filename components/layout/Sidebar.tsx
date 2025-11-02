import React from 'react';
import { Tab } from '../../types';
import SparklesIcon from '../icons/SparklesIcon';
import FileIcon from '../icons/FileIcon';
import CalendarIcon from '../icons/CalendarIcon';
import LinkIcon from '../icons/LinkIcon';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'ai', name: 'AI Assistant', icon: SparklesIcon },
    { id: 'files', name: 'Files', icon: FileIcon },
    { id: 'reminders', name: 'Reminders', icon: CalendarIcon },
    { id: 'events', name: 'Events', icon: LinkIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-100/50 dark:bg-gray-900/50 backdrop-blur-md p-4 space-y-2 border-r border-slate-200/50 dark:border-gray-700/50">
      <h2 className="text-lg font-bold px-2 pb-2 text-gray-700 dark:text-gray-300">Navigation</h2>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as Tab)}
          className={`flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <tab.icon className="w-5 h-5" />
          <span>{tab.name}</span>
        </button>
      ))}
    </aside>
  );
};

export default Sidebar;
