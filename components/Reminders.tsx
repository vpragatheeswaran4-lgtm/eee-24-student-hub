import React, { useState } from 'react';
import { Reminder, UserRole } from '../types';
import Modal from './Modal';
import CalendarIcon from './icons/CalendarIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import FileIcon from './icons/FileIcon';
import LinkIcon from './icons/LinkIcon';

interface RemindersProps {
  userRole: UserRole;
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'attachment' | 'link'>, attachmentFile?: File, linkUrl?: string) => void;
  onDeleteReminder: (id: string) => void;
}

const ReminderForm: React.FC<{ onSave: (reminder: Omit<Reminder, 'id' | 'attachment' | 'link'>, attachmentFile?: File, linkUrl?: string) => void; onCancel: () => void; }> = ({ onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [link, setLink] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && dateTime) {
            onSave({ title, description, dateTime: new Date(dateTime) }, file || undefined, link || undefined);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
             <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link (Optional)</label>
                <input type="url" id="link" value={link} onChange={e => setLink(e.target.value)} placeholder="https://example.com" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachment (Optional)</label>
                <input type="file" id="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                {file && <span className="text-xs text-gray-500">{file.name}</span>}
            </div>
            <div>
                <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</label>
                <input type="datetime-local" id="dateTime" value={dateTime} onChange={e => setDateTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Save Reminder</button>
            </div>
        </form>
    );
}

const Reminders: React.FC<RemindersProps> = ({ userRole, reminders, onAddReminder, onDeleteReminder }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sortedReminders = [...reminders].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const handleSave = (reminder: Omit<Reminder, 'id' | 'attachment' | 'link'>, attachmentFile?: File, linkUrl?: string) => {
    onAddReminder(reminder, attachmentFile, linkUrl);
    setIsModalOpen(false);
  };
  
  return (
    <div className="bg-slate-50/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Reminders</h2>
        {userRole === UserRole.Admin && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="w-4 h-4" />
            <span>Add Reminder</span>
          </button>
        )}
      </div>
       <div className="space-y-4">
        {sortedReminders.length > 0 ? sortedReminders.map(reminder => (
          <div key={reminder.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-shrink-0">
                <CalendarIcon className="w-6 h-6 text-purple-500"/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{reminder.title}</p>
                {userRole === UserRole.Admin && (
                    <button onClick={() => onDeleteReminder(reminder.id)} className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors ml-2">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{reminder.description}</p>
              
              {(reminder.attachment || reminder.link) && (
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                    {reminder.attachment && (
                        <a href={reminder.attachment.url} download={reminder.attachment.name} className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline">
                            <FileIcon className="w-3 h-3" />
                            <span>{reminder.attachment.name}</span>
                        </a>
                    )}
                    {reminder.link && (
                        <a href={reminder.link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:underline">
                            <LinkIcon className="w-3 h-3" />
                            <span>Reference Link</span>
                        </a>
                    )}
                </div>
              )}

              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
                {reminder.dateTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        )) : (
             <p className="text-center text-gray-500 py-4">No reminders set yet.</p>
        )}
      </div>
      {userRole === UserRole.Admin && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add a New Reminder">
            <ReminderForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Reminders;
