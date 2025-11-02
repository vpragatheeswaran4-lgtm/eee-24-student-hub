import React, { useState } from 'react';
import { EventLink, UserRole } from '../types';
import Modal from './Modal';
import LinkIcon from './icons/LinkIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import FileIcon from './icons/FileIcon';

interface EventLinksProps {
  userRole: UserRole;
  eventLinks: EventLink[];
  onAddEventLink: (eventLink: Omit<EventLink, 'id' | 'attachment'>, attachmentFile?: File) => void;
  onDeleteEventLink: (id: string) => void;
}

const EventLinkForm: React.FC<{ onSave: (eventLink: Omit<EventLink, 'id' | 'attachment'>, attachmentFile?: File) => void; onCancel: () => void; }> = ({ onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && url && dateTime) {
            onSave({ title, description, url, dateTime: new Date(dateTime) }, file || undefined);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input type="text" id="event-title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
                <label htmlFor="event-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                <input type="url" id="event-url" value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://example.com" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
                <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea id="event-description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
             <div>
                <label htmlFor="file-attachment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachment (Optional)</label>
                <input type="file" id="file-attachment" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                 {file && <span className="text-xs text-gray-500">{file.name}</span>}
            </div>
             <div>
                <label htmlFor="event-dateTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</label>
                <input type="datetime-local" id="event-dateTime" value={dateTime} onChange={e => setDateTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Save Event</button>
            </div>
        </form>
    );
}

const EventLinks: React.FC<EventLinksProps> = ({ userRole, eventLinks, onAddEventLink, onDeleteEventLink }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sortedEvents = [...eventLinks].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const handleSave = (eventLink: Omit<EventLink, 'id' | 'attachment'>, attachmentFile?: File) => {
    onAddEventLink(eventLink, attachmentFile);
    setIsModalOpen(false);
  };
  
  return (
    <div className="bg-slate-50/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-lg">
       <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Upcoming Events</h2>
        {userRole === UserRole.Admin && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        )}
      </div>
       <div className="space-y-4">
        {sortedEvents.length > 0 ? sortedEvents.map(event => (
          <div key={event.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-shrink-0">
                <LinkIcon className="w-6 h-6 text-green-500" />
            </div>
             <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate">{event.title}</a>
                {userRole === UserRole.Admin && (
                    <button onClick={() => onDeleteEventLink(event.id)} className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors ml-2">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
              
              {event.attachment && (
                <div className="mt-2">
                    <a href={event.attachment.url} download={event.attachment.name} className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        <FileIcon className="w-3 h-3" />
                        <span>{event.attachment.name}</span>
                    </a>
                </div>
              )}

              <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                {event.dateTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        )) : (
             <p className="text-center text-gray-500 py-4">No events posted yet.</p>
        )}
      </div>
       {userRole === UserRole.Admin && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add a New Event">
            <EventLinkForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default EventLinks;
