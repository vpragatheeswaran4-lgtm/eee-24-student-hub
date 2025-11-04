import React, { useRef, useEffect, useState } from 'react';
import Modal from './Modal';
import RefreshIcon from './icons/RefreshIcon';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    let streamInstance: MediaStream | null = null;
    
    const stopCurrentStream = () => {
        if (streamInstance) {
            streamInstance.getTracks().forEach(track => track.stop());
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    if (isOpen) {
        const getMedia = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                setVideoDevices(devices.filter(device => device.kind === 'videoinput'));

                streamInstance = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode }
                });
                
                setStream(streamInstance);
                if (videoRef.current) {
                    videoRef.current.srcObject = streamInstance;
                }
                setError(null);
                
            } catch (err) {
                console.error(`Error accessing camera with facingMode: ${facingMode}`, err);
                try {
                    console.log("Falling back to any available camera.");
                    streamInstance = await navigator.mediaDevices.getUserMedia({ video: true });
                    setStream(streamInstance);
                    if (videoRef.current) {
                        videoRef.current.srcObject = streamInstance;
                    }
                    setError(null);
                } catch (fallbackErr) {
                     console.error("Error accessing camera on fallback:", fallbackErr);
                     setError("Could not access the camera. Please check permissions and try again.");
                }
            }
        };

        getMedia();
    }

    return () => {
        stopCurrentStream();
        setStream(null);
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
          }
        }, 'image/jpeg');
      }
    }
  };

  const switchCamera = () => {
    if (videoDevices.length > 1) {
      setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Take a Picture">
      <div className="flex flex-col items-center">
        {error ? (
            <p className="text-red-500 text-center p-4">{error}</p>
        ) : (
            <>
                <div className="w-full relative bg-gray-900 rounded-lg overflow-hidden max-h-[60vh]">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                    {videoDevices.length > 1 && (
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
                    disabled={!stream}
                    className="mt-4 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Capture
                </button>
            </>
        )}
      </div>
    </Modal>
  );
};

export default CameraModal;
