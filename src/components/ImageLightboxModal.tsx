import React from 'react';
import { X, Download, ZoomIn, ExternalLink } from 'lucide-react';
import { ImageAttachment } from '../types';
import { playSound } from '../utils/audio';

interface ImageLightboxModalProps {
  image: ImageAttachment | null;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ image, onClose }) => {
  if (!image) return null;

  const handleDownload = () => {
    playSound('click');
    const a = document.createElement('a');
    a.href = image.dataUrl;
    a.download = image.fileName || `aether-optical-frame-${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] bg-[#060714] border border-[#00f2ff44] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.3)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#0a0c24] border-b border-[#00f2ff33] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
            <span className="text-white text-xs font-bold tracking-widest uppercase">
              OPTICAL FRAME TELEMETRY // {image.fileName || 'RAW SENSOR CAPTURE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] transition text-xs flex items-center gap-1 cursor-pointer"
              title="Download image"
            >
              <Download className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">EXPORT</span>
            </button>
            <button
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="p-1.5 rounded-lg border border-slate-700 hover:border-rose-500 bg-black/40 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
          <img
            src={image.dataUrl}
            alt={image.fileName || 'Optical Frame'}
            className="max-h-[75vh] w-auto object-contain rounded-lg border border-[#00f2ff22]"
          />
        </div>

        {/* Footer Details */}
        <div className="px-4 py-2.5 bg-[#0a0c24] border-t border-[#00f2ff22] flex items-center justify-between text-[10px] text-slate-400">
          <span>SOURCE: {image.sourceType || 'OPTICAL SENSOR'}</span>
          <span>MIME: {image.mimeType || 'IMAGE/JPEG'}</span>
        </div>
      </div>
    </div>
  );
};
