import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import MinusIcon from './icons/MinusIcon';
import DownloadIcon from './icons/DownloadIcon';
import RefreshIcon from './icons/RefreshIcon';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, imageUrl }) => {
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset zoom when modal is closed
      setTimeout(() => setZoom(1), 200);
    }
  }, [isOpen]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.2));
  const resetZoom = () => setZoom(1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Image Preview">
      <div className="flex flex-col items-center">
        <div className="w-full h-[60vh] overflow-auto flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg mb-4">
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Preview"
              className="max-w-full max-h-full transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          )}
        </div>
        <div className="flex items-center justify-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
          <button onClick={zoomOut} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Zoom Out">
            <MinusIcon className="w-5 h-5" />
          </button>
          <button onClick={resetZoom} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Reset Zoom">
            <RefreshIcon className="w-5 h-5" />
          </button>
          <button onClick={zoomIn} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Zoom In">
            <PlusIcon className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-2"></div>
          <button onClick={handleDownload} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Download Image">
            <DownloadIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImagePreviewModal;
