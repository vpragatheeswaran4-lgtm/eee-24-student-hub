import React from 'react';
import { UserRole, Tab, UploadedFile, Reminder, EventLink, ChatMessage, AiMode } from '../types';
import FileList from './FileList';
import Reminders from './Reminders';
import EventLinks from './EventLinks';
import AICompanion from './AICompanion';

interface DashboardProps {
  userRole: UserRole;
  activeTab: Tab;
  files: UploadedFile[];
  isFileLoading: boolean;
  fileError: string | null;
  currentFolderId: string | null;
  onNavigateToFolder: (folderId: string | null) => void;
  reminders: Reminder[];
  eventLinks: EventLink[];
  onAddFile: (file: File, parentId: string | null) => Promise<void>;
  onDeleteFile: (id: string) => Promise<void>;
  onAddFileLink: (link: { url: string; name: string }, parentId: string | null) => Promise<void>;
  onAddFolder: (folderName: string, parentId: string | null) => Promise<void>;
  onRenameFile: (id: string, newName: string) => Promise<void>;
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

const Dashboard: React.FC<DashboardProps> = (props) => {
  const {
    userRole,
    activeTab,
    files,
    isFileLoading,
    fileError,
    currentFolderId,
    onNavigateToFolder,
    reminders,
    eventLinks,
    onAddFile,
    onDeleteFile,
    onAddFileLink,
    onAddFolder,
    onRenameFile,
    onAddReminder,
    onDeleteReminder,
    onAddEventLink,
    onDeleteEventLink,
    chatHistory,
    isAiLoading,
    onSendMessageToAI,
    aiMode,
    onAiModeChange
  } = props;

  const renderContent = () => {
    switch (activeTab) {
      case 'ai':
        return <AICompanion 
            chatHistory={chatHistory} 
            isLoading={isAiLoading} 
            onSendMessage={onSendMessageToAI} 
            aiMode={aiMode}
            onAiModeChange={onAiModeChange}
        />;
      case 'files':
        return <FileList 
          userRole={userRole} 
          files={files} 
          isLoading={isFileLoading}
          error={fileError}
          currentFolderId={currentFolderId}
          onNavigate={onNavigateToFolder}
          onAddFile={onAddFile} 
          onDeleteFile={onDeleteFile} 
          onAddFileLink={onAddFileLink} 
          onAddFolder={onAddFolder}
          onRename={onRenameFile}
        />;
      case 'reminders':
        return <Reminders userRole={userRole} reminders={reminders} onAddReminder={onAddReminder} onDeleteReminder={onDeleteReminder} />;
      case 'events':
        return <EventLinks userRole={userRole} eventLinks={eventLinks} onAddEventLink={onAddEventLink} onDeleteEventLink={onDeleteEventLink} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
        {renderContent()}
    </div>
  );
};

export default Dashboard;