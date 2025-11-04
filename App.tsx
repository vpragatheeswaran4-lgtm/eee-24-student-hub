import React, { useState } from 'react';
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
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Mock data
  const [files, setFiles] = useState<UploadedFile[]>([
    { id: 'folder-1', name: 'Course Materials', size: 0, type: 'folder', uploadDate: new Date(), url: '', isFolder: true, parentId: null },
    { id: 'file-1', name: 'Syllabus.pdf', size: 102400, type: 'application/pdf', uploadDate: new Date(), url: '#', parentId: 'folder-1' },
    { id: 'folder-2', name: 'ECA', size: 0, type: 'folder', uploadDate: new Date(), url: '', isFolder: true, parentId: null },
    { id: 'file-2', name: 'Event Schedule.xlsx', size: 25600, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploadDate: new Date(), url: '#', parentId: 'folder-2' },
    { id: 'folder-3', name: 'Assignments', size: 0, type: 'folder', uploadDate: new Date(), url: '', isFolder: true, parentId: null },
    { id: 'file-3', name: 'DSP_Assignment_1.pdf', size: 5120, type: 'application/pdf', uploadDate: new Date(), url: '#', parentId: 'folder-3' },
  ]);

  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', title: 'Assignment 3 Submission', description: 'Submit the DSP assignment on the portal.', dateTime: new Date('2024-08-01T23:59:00Z') },
    { id: '2', title: 'Mid-Term Exam Registration', description: 'Register for the upcoming mid-term exams. Last date!', dateTime: new Date('2024-07-25T17:00:00Z') },
  ]);

  const [eventLinks, setEventLinks] = useState<EventLink[]>([
    { id: '1', title: 'Guest Lecture on AI', description: 'Join us for a lecture by Dr. Smith on AI in Electrical Engineering.', url: '#', dateTime: new Date('2024-07-30T11:00:00Z') },
  ]);
  
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

    const apiKey = aiMode === 'image' ? process.env.IMAGE_API_KEY : process.env.API_KEY;

    if (!apiKey) {
      const keyName = aiMode === 'image' ? 'IMAGE_API_KEY' : 'API_KEY';
      const errorMessage = `The ${keyName} is not configured. Please ask the administrator to set this environment variable in the Vercel project settings.`;
      setChatHistory(prev => [...prev, { role: 'model', text: errorMessage }]);
      setIsAiLoading(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    if (aiMode === 'image') {
        try {
            if (attachedFile) {
                setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, image generation mode doesn't support file attachments. Please provide a text prompt." }]);
                return;
            }
            if (!effectivePrompt) {
                 setChatHistory(prev => [...prev, { role: 'model', text: "Please describe the image you want to create." }]);
                 return;
            }

            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: effectivePrompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: '1:1',
                },
            });

            if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                const imageAttachment: ChatAttachment = {
                    name: `generated-${effectivePrompt.substring(0, 20)}.jpg`,
                    type: 'image/jpeg',
                    previewUrl: imageUrl,
                };
                setChatHistory(prev => [...prev, { role: 'model', text: ``, attachment: imageAttachment }]);
            } else {
                 setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I couldn't generate an image. Please try a different prompt." }]);
            }
        } catch (error) {
            console.error("Error calling Imagen API:", error);
            setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error while generating the image. Please try again." }]);
        } finally {
            setIsAiLoading(false);
        }
        return;
    }

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


  const handleAddFile = (file: File, parentId: string | null) => {
    const newFile: UploadedFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date(),
      url: URL.createObjectURL(file),
      isLink: false,
      parentId,
    };
    setFiles(prev => [newFile, ...prev]);
  };

  const handleAddFileLink = (link: { url: string; name: string }, parentId: string | null) => {
    const newLinkFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: link.name,
        size: 0,
        type: 'link',
        uploadDate: new Date(),
        url: link.url,
        isLink: true,
        parentId,
    };
    setFiles(prev => [newLinkFile, ...prev]);
  }
  
  const handleRenameFile = (id: string, newName: string) => {
    setFiles(prevFiles => prevFiles.map(file => 
      file.id === id ? { ...file, name: newName } : file
    ));
  };

  const handleDeleteFile = (id: string) => {
    let idsToDelete: string[] = [id];
    const fileToDelete = files.find(f => f.id === id);

    if (fileToDelete?.isFolder) {
        const getDescendants = (folderId: string): string[] => {
            const children = files.filter(f => f.parentId === folderId);
            let descendants: string[] = [];
            for (const child of children) {
                descendants.push(child.id);
                if (child.isFolder) {
                    descendants = [...descendants, ...getDescendants(child.id)];
                }
            }
            return descendants;
        };
        idsToDelete = [...idsToDelete, ...getDescendants(id)];
    }
    
    idsToDelete.forEach(deleteId => {
        const file = files.find(f => f.id === deleteId);
        if (file && !file.isLink && file.url.startsWith('blob:')) {
            URL.revokeObjectURL(file.url);
        }
    });
    
    setFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
  };


  const handleAddFolder = (folderName: string, parentId: string | null) => {
    const newFolder: UploadedFile = {
      id: crypto.randomUUID(),
      name: folderName,
      size: 0,
      type: 'folder',
      uploadDate: new Date(),
      url: '',
      isFolder: true,
      isLink: false,
      parentId,
    };
    setFiles(prev => [newFolder, ...prev]);
  };

  const handleAddReminder = (reminder: Omit<Reminder, 'id' | 'attachment' | 'link'>, attachmentFile?: File, linkUrl?: string) => {
    let attachment: UploadedFile | undefined = undefined;
    if (attachmentFile) {
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