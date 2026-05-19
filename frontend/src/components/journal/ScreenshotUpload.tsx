import React, { useRef, useState } from 'react';
import { Upload, X, Image } from 'lucide-react';

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('trade_id', tradeId);

      const tokens = JSON.parse(localStorage.getItem('bt_tokens') || '{}');
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
        <div className="relative inline-block rounded-lg overflow-hidden" style={{ border: 'var(--border-subtle)' }}>
          <img src={preview} alt="Screenshot" className="max-h-32 object-contain" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white cursor-pointer border-none"
          >
            <X size={12} />
          </button>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-xs font-mono text-white">Uploading...</span>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer border-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)', border: '1px dashed rgba(255,255,255,0.12)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          <Image size={12} />
          Screenshot
        </button>
      )}
    </div>
  );
};

export default ScreenshotUpload;
