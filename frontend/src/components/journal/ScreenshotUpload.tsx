import React, { useRef, useState } from 'react';
import { X, Image } from 'lucide-react';

interface ScreenshotUploadProps {
  tradeId: string;
  onUploaded?: (url: string) => void;
}

const ScreenshotUpload: React.FC<ScreenshotUploadProps> = ({ tradeId, onUploaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem('bt_tokens') || '{}');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('trade_id', tradeId);
      const resp = await fetch('/api/v1/upload/screenshot', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        body: formData,
      });
      if (resp.ok) {
        const data = await resp.json();
        onUploaded?.(data.url);
      }
    } catch {
      /* silent */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
      {preview ? (
        <div className="relative inline-block rounded-lg overflow-hidden" style={{ border: '1px solid #EEF0F3' }}>
          <img src={preview} alt="Screenshot" className="max-h-32 object-contain" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-1 right-1 p-0.5 rounded cursor-pointer border-none"
            style={{ background: 'rgba(0,0,0,0.60)', color: '#FFFFFF' }}
          >
            <X size={12} />
          </button>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.40)' }}>
              <span className="text-[12px]" style={{ color: '#FFFFFF' }}>Uploading...</span>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border-none transition-all"
          style={{ color: '#9CA3AF', border: '1px dashed #D1D5DB' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; e.currentTarget.style.color = '#6C5CE7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#9CA3AF'; }}
        >
          <Image size={12} />
          Screenshot
        </button>
      )}
    </div>
  );
};

export default ScreenshotUpload;
