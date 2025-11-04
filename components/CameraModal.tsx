import React, { useRef, useEffect, useState, useCallback } from 'react';
import Modal from './Modal';
import RefreshIcon from './icons/RefreshIcon';
import CameraIcon from './icons/CameraIcon';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      stopStream();
      return;
    }

    const startStream = async () => {
      stopStream(); // Ensure any previous stream is stopped.
      
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);

        const constraints: MediaStreamConstraints = {
            video: { 
                facingMode: { ideal: facingMode } 
            }
        };
        
        const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = currentStream;
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error(`Error accessing camera with facingMode: ${facingMode}`, err);
        // Fallback to any camera if the preferred one fails
        try {
            console.log("Falling back to any available camera.");
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = currentStream;
            if (videoRef.current) {
              videoRef.current.srcObject = currentStream;
            }
        } catch (fallbackErr) {
            console.error("Fallback camera access error:", fallbackErr);
            setError("Could not access camera. Please ensure permissions are granted in your browser settings and try again.");
        }
      }
    };

    startStream();

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, stopStream]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 3) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the image horizontally if it's the user-facing camera to match the preview
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const switchCamera = () => {
    if (hasMultipleCameras) {
      setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Take a Picture">
      <div className="flex flex-col items-center">
        {error ? (
            <div className="text-red-500 text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg w-full">
                <p className="font-semibold">Camera Error</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        ) : (
            <>
                <div className="w-full relative bg-gray-900 rounded-lg overflow-hidden max-h-[60vh] aspect-[4/3]">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                    {hasMultipleCameras && (
                        <button
                            onClick={switchCamera}
                            className="absolute bottom-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Switch Camera"
                        >
                            <RefreshIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <button
                    onClick={handleCapture}
                    disabled={!videoRef.current?.srcObject}
                    className="mt-4 px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-full shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                   <CameraIcon className="w-5 h-5" />
                   <span>Capture</span>
                </button>
            </>
        )}
      </div>
    </Modal>
  );
};

export default CameraModal;