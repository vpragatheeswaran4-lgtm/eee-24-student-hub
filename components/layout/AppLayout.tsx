import React from 'react';
import Header from '../Header';
import Dashboard from '../Dashboard';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { UserRole, Tab, UploadedFile, Reminder, EventLink, ChatMessage, AiMode } from '../../types';

interface AppLayoutProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  files: UploadedFile[];
  currentFolderId: string | null;
  onNavigateToFolder: (folderId: string | null) => void;
  reminders: Reminder[];
  eventLinks: EventLink[];
  onAddFile: (file: File, parentId: string | null) => void;
  onDeleteFile: (id: string) => void;
  onAddFileLink: (link: { url: string; name: string }, parentId: string | null) => void;
  onAddFolder: (folderName: string, parentId: string | null) => void;
  onRenameFile: (id: string, newName: string) => void;
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'attachment' | 'link'>, attachmentFile?: File, linkUrl?: string) => void;
  onDeleteReminder: (id: string) => void;
  onAddEventLink: (eventLink: Omit<EventLink, 'id' | 'attachment'>, attachmentFile?: File) => void;
  onDeleteEventLink: (id: string) => void;
  chatHistory: ChatMessage[];
  isAiLoading: boolean;
  onSendMessageToAI: (prompt: string, imageFile: File | null) => void;
  aiMode: AiMode;
  onAiModeChange: (mode: AiMode) => void;
}

const AppLayout: React.FC<AppLayoutProps> = (props) => {
  return (
    <div className="relative z-10 bg-black bg-opacity-10 dark:bg-opacity-20 min-h-screen flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <Sidebar activeTab={props.activeTab} onTabChange={props.onTabChange} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userRole={props.userRole} onRoleChange={props.onRoleChange} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Dashboard {...props} />
        </main>

        {/* Bottom Nav for Mobile */}
        <BottomNav activeTab={props.activeTab} onTabChange={props.onTabChange} />
      </div>
    </div>
  );
};

export default AppLayout;
