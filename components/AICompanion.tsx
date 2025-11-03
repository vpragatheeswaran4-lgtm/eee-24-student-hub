import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AiMode, Source } from '../types';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import SparklesIcon from './icons/SparklesIcon';
import XCircleIcon from './icons/XCircleIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import FileIcon from './icons/FileIcon';
import LightningBoltIcon from './icons/LightningBoltIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import GlobeAltIcon from './icons/GlobeAltIcon';
import LinkIcon from './icons/LinkIcon';
import CameraIcon from './icons/CameraIcon';
import CameraModal from './CameraModal';
import PhotoIcon from './icons/PhotoIcon';
import ImagePreviewModal from './ImagePreviewModal';


interface AICompanionProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (prompt: string, attachedFile: File | null) => void;
  aiMode: AiMode;
  onAiModeChange: (mode: AiMode) => void;
}

const aiModes: { id: AiMode, name: string, description: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'balanced', name: 'Balanced', description: 'Good for most tasks.', icon: SparklesIcon },
    { id: 'fast', name: 'Fast', description: 'Quick, low-latency responses.', icon: LightningBoltIcon },
    { id: 'advanced', name: 'Advanced', description: 'For complex, creative tasks.', icon: AcademicCapIcon },
    { id: 'web', name: 'Web Search', description: 'For up-to-date information.', icon: GlobeAltIcon },
    { id: 'image', name: 'Image Gen', description: 'Create images from text.', icon: PhotoIcon },
];


const AICompanion: React.FC<AICompanionProps> = ({ chatHistory, isLoading, onSendMessage, aiMode, onAiModeChange }) => {
  const [prompt, setPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setFilePreviewUrl(previewUrl);
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleImageCapture = (file: File) => {
    if (aiMode === 'web' || aiMode === 'image') {
      return;
    }
    clearAttachment();
    setAttachedFile(file);
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
    } else {
      setFilePreviewUrl(null);
    }
  };

  useEffect(() => {
    if ((aiMode === 'web' || aiMode === 'image') && attachedFile) {
        clearAttachment();
    }
  }, [aiMode, attachedFile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() || attachedFile) {
      onSendMessage(prompt, attachedFile);
      setPrompt('');
      clearAttachment();
    }
  };

  return (
    <div className="bg-slate-50/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && <SparklesIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mb-1" />}
            <div className={`max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
              {msg.attachment && (
                <div className="mb-2">
                  {msg.attachment.previewUrl ? (
                    <button
                      onClick={() => setPreviewImageUrl(msg.attachment.previewUrl!)}
                      className="block rounded-lg overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-700"
                      title="Click to view larger image"
                    >
                      <img 
                          src={msg.attachment.previewUrl} 
                          alt={msg.attachment.name} 
                          className="rounded-lg max-h-48 transition-transform duration-200 group-hover:scale-105" 
                      />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500">
                      <FileIcon className="w-6 h-6 text-white flex-shrink-0" />
                      <div className="text-white text-sm truncate">
                        <p className="font-medium" title={msg.attachment.name}>{msg.attachment.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
               {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Sources:</h4>
                      <ul className="space-y-1">
                          {msg.sources.map((source, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <LinkIcon className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate" title={source.uri}>
                                    {source.title || source.uri}
                                </a>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex items-end gap-2 justify-start">
            <SparklesIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mb-1 animate-pulse" />
            <div className="max-w-lg p-3 rounded-2xl bg-gray-200 dark:bg-gray-700">
                <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
            </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-center flex-wrap gap-2 mb-3">
            {aiModes.map(mode => (
                <button
                    key={mode.id}
                    onClick={() => onAiModeChange(mode.id)}
                    title={mode.description}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        aiMode === mode.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    <mode.icon className="w-4 h-4" />
                    <span>{mode.name}</span>
                </button>
            ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
           <button type="button" onClick={() => fileInputRef.current?.click()} disabled={aiMode === 'web' || aiMode === 'image'} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
               <PaperclipIcon className="w-6 h-6" />
           </button>
           <button type="button" onClick={() => setIsCameraOpen(true)} disabled={aiMode === 'web' || aiMode === 'image'} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
               <CameraIcon className="w-6 h-6" />
           </button>
           <div className="flex-1 relative">
            {attachedFile && (
                <div className="absolute bottom-12 left-0 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    {filePreviewUrl ? (
                        <img src={filePreviewUrl} alt="Preview" className="h-16 w-16 object-cover rounded" />
                    ): (
                        <div className="h-16 w-32 p-2 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                            <FileIcon className="w-6 h-6 text-gray-500 mr-2" />
                            <span className="text-xs text-gray-600 dark:text-gray-300 truncate" title={attachedFile.name}>{attachedFile.name}</span>
                        </div>
                    )}
                    <button type="button" onClick={clearAttachment} className="absolute -top-1 -right-1 bg-gray-700 text-white rounded-full">
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                    aiMode === 'web' ? "Ask me anything about current events..." :
                    aiMode === 'image' ? "Describe the image you want to create..." :
                    "Ask me anything or attach a file..."
                }
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
            />
           </div>
           <button type="submit" disabled={isLoading || (!prompt.trim() && !attachedFile)} className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
               <PaperAirplaneIcon className="w-6 h-6" />
           </button>
        </form>
      </div>
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handleImageCapture}
      />
      <ImagePreviewModal
        isOpen={!!previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
        imageUrl={previewImageUrl}
      />
    </div>
  );
};

export default AICompanion;
