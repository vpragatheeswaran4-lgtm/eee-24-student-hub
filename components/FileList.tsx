import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadedFile, UserRole } from '../types';
import FileIcon from './icons/FileIcon';
import TrashIcon from './icons/TrashIcon';
import UploadIcon from './icons/UploadIcon';
import LinkIcon from './icons/LinkIcon';
import PlusIcon from './icons/PlusIcon';
import FolderIcon from './icons/FolderIcon';
import EditIcon from './icons/EditIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface FileListProps {
  userRole: UserRole;
  files: UploadedFile[];
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
  onAddFile: (file: File, parentId: string | null) => void;
  onDeleteFile: (id: string) => void;
  onAddFileLink: (link: { url: string; name: string }, parentId: string | null) => void;
  onAddFolder: (folderName: string, parentId: string | null) => void;
  onRename: (id: string, newName: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUploader: React.FC<{ onAddFile: (file: File) => void }> = ({ onAddFile }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onAddFile(e.target.files[0]);
        }
    };
    
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onAddFile(e.dataTransfer.files[0]);
        }
    }, [onAddFile]);

    return (
        <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
            </p>
        </div>
    );
};

const LinkUploader: React.FC<{ onAddFileLink: (link: { url: string, name: string }) => void }> = ({ onAddFileLink }) => {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url && name) {
            onAddFileLink({ url, name });
            setUrl('');
            setName('');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or add from a URL</p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Link Title" required className="flex-grow px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." required className="flex-grow px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                <button type="submit" className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Link</span>
                </button>
            </div>
        </form>
    );
};

const FolderCreator: React.FC<{ onAddFolder: (name: string) => void; onCancel: () => void }> = ({ onAddFolder, onCancel }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddFolder(name.trim());
            onCancel();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Create a new folder</p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Folder Name" 
                    required 
                    autoFocus
                    className="flex-grow px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                    Cancel
                </button>
                <button type="submit" className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    <span>Create</span>
                </button>
            </div>
        </form>
    );
};


const FileList: React.FC<FileListProps> = ({ userRole, files, currentFolderId, onNavigate, onAddFile, onDeleteFile, onAddFileLink, onAddFolder, onRename }) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleRenameSubmit = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleBack = () => {
    if (currentFolderId) {
      const currentFolder = files.find(f => f.id === currentFolderId);
      onNavigate(currentFolder?.parentId ?? null);
    }
  };

  const displayedFiles = files
    .filter(file => file.parentId === currentFolderId)
    .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        if (a.isFolder && b.isFolder) {
            return a.name.localeCompare(b.name);
        }
        return b.uploadDate.getTime() - a.uploadDate.getTime();
    });

  return (
    <div className="bg-slate-50/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Documents & Files</h2>

      {userRole === UserRole.Admin && (
        <div className="mb-6">
            <FileUploader onAddFile={(file) => onAddFile(file, currentFolderId)} />
            <LinkUploader onAddFileLink={(link) => onAddFileLink(link, currentFolderId)} />
              <div className="mt-4">
                {!isCreatingFolder ? (
                    <div className="text-center">
                        <button 
                            onClick={() => setIsCreatingFolder(true)}
                            className="flex items-center justify-center w-full sm:w-auto sm:inline-flex space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors"
                        >
                            <FolderIcon className="w-5 h-5" />
                            <span>Create New Folder</span>
                        </button>
                    </div>
                ) : (
                    <FolderCreator onAddFolder={(name) => onAddFolder(name, currentFolderId)} onCancel={() => setIsCreatingFolder(false)} />
                )}
            </div>
        </div>
      )}

       <div className="space-y-3">
        {displayedFiles.length > 0 ? displayedFiles.map(file => (
          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
                {file.isFolder ? <FolderIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" /> : file.isLink ? <LinkIcon className="w-6 h-6 text-green-500 flex-shrink-0" /> : <FileIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                    {userRole === UserRole.Admin && editingId === file.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleRenameSubmit(); }} className="flex-1">
                        <input
                            ref={editInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleRenameSubmit}
                            className="text-sm font-medium bg-white dark:bg-gray-800 border border-blue-500 rounded px-1 py-0.5 w-full"
                        />
                      </form>
                    ) : (
                        file.isFolder ? (
                            <button onClick={() => onNavigate(file.id)} className="text-left w-full">
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate hover:underline" title={file.name}>
                                    {file.name}
                                </span>
                            </button>
                        ) : (
                            <a href={file.url} download={!file.isLink ? file.name : undefined} target={file.isLink ? "_blank" : "_self"} rel={file.isLink ? "noopener noreferrer" : ""} className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate hover:underline" title={file.name}>
                                {file.name}
                            </a>
                        )
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.isFolder ? 'Folder' : file.isLink ? 'Web Link' : formatFileSize(file.size)} - {file.uploadDate.toLocaleDateString()}
                    </p>
                </div>
            </div>
           
            {userRole === UserRole.Admin && (
              <div className="flex items-center flex-shrink-0">
                <button onClick={() => { setEditingId(file.id); setEditingName(file.name); }} className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={`Rename ${file.name}`}>
                    <EditIcon className="w-4 h-4" />
                </button>
                <button onClick={() => onDeleteFile(file.id)} className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" aria-label={`Delete ${file.name}`}>
                    <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )) : (
            <p className="text-center text-gray-500 py-4">
              {currentFolderId === null ? "No files or folders have been added yet." : "This folder is empty."}
            </p>
        )}
      </div>
      {userRole === UserRole.Student && currentFolderId && (
        <div className="mt-6 text-center">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-full sm:w-auto sm:inline-flex space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FileList;