import React, { useState, useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import { UserRole, Tab, UploadedFile, Reminder, EventLink, ChatMessage, ChatAttachment, AiMode, Source } from './types';
import { GoogleGenAI } from '@google/genai';

const AnimatedBackground: React.FC<{ activeTab: Tab }> = ({ activeTab }) => {
  const backgrounds: Record<Tab, { gradient: string; elements: React.ReactNode }> = {
    ai: {
      gradient: 'from-gray-900 via-indigo-900 to-black',
      elements: (
        <div className="absolute inset-0 overflow-hidden">
          <div className="supernova"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="comet"
              style={{
                top: `${Math.random() * 100}%`,
                left: `-10%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      )
    },
    files: {
      gradient: 'from-sky-300 via-blue-400 to-yellow-200',
      elements: (
        <div className="absolute inset-0 overflow-hidden">
          <div className="sun"></div>
        </div>
      ),
    },
    reminders: {
      gradient: 'from-slate-300 via-cyan-400 to-white',
      elements: (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}vw`,
                animationDuration: `${Math.random() * 5 + 5}s`,
                animationDelay: `${Math.random() * 5}s`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                opacity: Math.random() * 0.5 + 0.3,
              }}
            />
          ))}
        </div>
      ),
    },
    events: {
      gradient: 'from-gray-800 via-slate-900 to-blue-900',
      elements: (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="raindrop"
              style={{
                left: `${Math.random() * 100}vw`,
                animationDuration: `${Math.random() * 0.5 + 0.5}s`,
                animationDelay: `${Math.random() * 10}s`,
                height: `${Math.random() * 15 + 10}px`,
              }}
            />
          ))}
        </div>
      ),
    },
  };

  return (
    <>
      {Object.entries(backgrounds).map(([tab, { gradient, elements }]) => (
        <div
          key={tab}
          className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-1000 ease-in-out ${
            activeTab === tab ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {activeTab === tab && elements}
        </div>
      ))}
    </>
  );
};


const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.Student);
  const [activeTab, setActiveTab] = useState<Tab>('ai');

  // AI State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('balanced');
  
  // File State
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Mock data
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', title: 'Assignment 3 Submission', description: 'Submit the DSP assignment on the portal.', dateTime: new Date('2024-08-01T23:59:00Z') },
    { id: '2', title: 'Mid-Term Exam Registration', description: 'Register for the upcoming mid-term exams. Last date!', dateTime: new Date('2024-07-25T17:00:00Z') },
  ]);

  const [eventLinks, setEventLinks] = useState<EventLink[]>([
    { id: '1', title: 'Guest Lecture on AI', description: 'Join us for a lecture by Dr. Smith on AI in Electrical Engineering.', url: '#', dateTime: new Date('2024-07-30T11:00:00Z') },
  ]);

  const fetchFiles = async (folderId: string | null) => {
    setIsFileLoading(true);
    setFileError(null);
    try {
        const parentId = folderId || 'root';
        const response = await fetch(`/api/files?parentId=${parentId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch files.');
        }
        const data: UploadedFile[] = await response.json();
        const formattedData = data.map(f => ({ ...f, uploadDate: new Date(f.uploadDate) }));
        setFiles(formattedData);
    } catch (err: any) {
        setFileError(err.message);
        console.error(err);
    } finally {
        setIsFileLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId]);
  
  const fileToGenerativePart = (file: File) => {
    return new Promise<{inlineData: {data:string, mimeType: string}}>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            if (base64Data) {
                resolve({
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    }
                });
            } else {
                reject(new Error("Failed to read file as base64."));
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
  }

  const handleSendMessageToAI = async (prompt: string, attachedFile: File | null) => {
    if (!prompt && !attachedFile) return;

    setIsAiLoading(true);
    let defaultPrompt = "Analyze this file and give me the important key points.";
    if (attachedFile?.type.startsWith('image/')) {
        defaultPrompt = "Analyze this image and provide the important key points.";
    }
    const effectivePrompt = prompt || (attachedFile ? defaultPrompt : "");
    
    const newAttachment: ChatAttachment | undefined = attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        previewUrl: attachedFile.type.startsWith('image/') ? URL.createObjectURL(attachedFile) : undefined
    } : undefined;

    setChatHistory(prev => [...prev, { role: 'user', text: effectivePrompt, attachment: newAttachment }]);

    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      const errorMessage = `The API_KEY is not configured. Please ask the administrator to set this environment variable in the Vercel project settings.`;
      setChatHistory(prev => [...prev, { role: 'model', text: errorMessage }]);
      setIsAiLoading(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const parts = [];
        if (attachedFile && aiMode !== 'web') {
            const filePart = await fileToGenerativePart(attachedFile);
            parts.push(filePart);
        }
        if (effectivePrompt) {
             parts.push({text: effectivePrompt});
        }
       
        let model = 'gemini-2.5-flash';
        const config: { [key: string]: any } = {};

        switch (aiMode) {
            case 'fast':
                model = 'gemini-flash-lite-latest';
                break;
            case 'advanced':
                model = 'gemini-2.5-pro';
                config.thinkingConfig = { thinkingBudget: 32768 };
                break;
            case 'web':
                if (attachedFile) {
                    setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I can't perform a web search on an uploaded file." }]);
                    setIsAiLoading(false);
                    return;
                }
                config.tools = [{googleSearch: {}}];
                break;
            case 'balanced':
            default:
                // model is already gemini-2.5-flash
                break;
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: config,
        });

        const text = response.text;
        
        let sources: Source[] | undefined = undefined;
        if (aiMode === 'web' && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            sources = response.candidates[0].groundingMetadata.groundingChunks
                .map(chunk => chunk.web)
                .filter((web): web is { uri: string; title: string } => !!web && !!web.uri && !!web.title);
        }

        setChatHistory(prev => [...prev, { role: 'model', text: text, sources }]);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsAiLoading(false);
    }
  };


  const handleAddFile = async (file: File, parentId: string | null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parentId', parentId || 'root');

    try {
      const response = await fetch('/api/files', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      await fetchFiles(currentFolderId); // Refetch files
    } catch (error) {
      console.error(error);
      setFileError('Failed to upload file.');
    }
  };

  const handleAddFileLink = async (link: { url: string; name: string }, parentId: string | null) => {
    try {
        const response = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'link', name: link.name, url: link.url, parentId: parentId || 'root' }),
        });
        if (!response.ok) throw new Error('Failed to add link');
        await fetchFiles(currentFolderId);
    } catch (error) {
        console.error(error);
        setFileError('Failed to add link.');
    }
  }
  
  const handleRenameFile = async (id: string, newName: string) => {
    try {
        const response = await fetch(`/api/files?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
        });
        if (!response.ok) throw new Error('Failed to rename file');
        await fetchFiles(currentFolderId);
    } catch (error) {
        console.error(error);
        setFileError('Failed to rename file.');
    }
  };

  const handleDeleteFile = async (id: string) => {
     try {
        const response = await fetch(`/api/files?id=${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete file');
        await fetchFiles(currentFolderId);
    } catch (error) {
        console.error(error);
        setFileError('Failed to delete file.');
    }
  };


  const handleAddFolder = async (folderName: string, parentId: string | null) => {
    try {
        const response = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'folder', name: folderName, parentId: parentId || 'root' }),
        });
        if (!response.ok) throw new Error('Failed to create folder');
        await fetchFiles(currentFolderId);
    } catch (error) {
        console.error(error);
        setFileError('Failed to create folder.');
    }
  };

  const handleAddReminder = (reminder: Omit<Reminder, 'id' | 'attachment' | 'link'>, attachmentFile?: File, linkUrl?: string) => {
    let attachment: UploadedFile | undefined = undefined;
    if (attachmentFile) {
        // This part needs adjustment if reminders are to be stored persistently
        attachment = {
            id: crypto.randomUUID(),
            name: attachmentFile.name,
            size: attachmentFile.size,
            type: attachmentFile.type,
            uploadDate: new Date(),
            url: URL.createObjectURL(attachmentFile),
        };
    }
    setReminders(prev => [{ ...reminder, id: crypto.randomUUID(), attachment, link: linkUrl }, ...prev]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };
  
  const handleAddEventLink = (eventLink: Omit<EventLink, 'id' | 'attachment'>, attachmentFile?: File) => {
    let attachment: UploadedFile | undefined = undefined;
    if (attachmentFile) {
         // This part needs adjustment if events are to be stored persistently
        attachment = {
            id: crypto.randomUUID(),
            name: attachmentFile.name,
            size: attachmentFile.size,
            type: attachmentFile.type,
            uploadDate: new Date(),
            url: URL.createObjectURL(attachmentFile),
        };
    }
    setEventLinks(prev => [{ ...eventLink, id: crypto.randomUUID(), attachment }, ...prev]);
  };

  const handleDeleteEventLink = (id: string) => {
    setEventLinks(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
        <AnimatedBackground activeTab={activeTab} />
        <AppLayout
            userRole={userRole}
            onRoleChange={setUserRole}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            files={files}
            isFileLoading={isFileLoading}
            fileError={fileError}
            currentFolderId={currentFolderId}
            onNavigateToFolder={setCurrentFolderId}
            reminders={reminders}
            eventLinks={eventLinks}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
            onAddFileLink={handleAddFileLink}
            onAddFolder={handleAddFolder}
            onRenameFile={handleRenameFile}
            onAddReminder={handleAddReminder}
            onDeleteReminder={handleDeleteReminder}
            onAddEventLink={handleAddEventLink}
            onDeleteEventLink={handleDeleteEventLink}
            chatHistory={chatHistory}
            isAiLoading={isAiLoading}
            onSendMessageToAI={handleSendMessageToAI}
            aiMode={aiMode}
            onAiModeChange={setAiMode}
        />
    </div>
  );
};

export default App;