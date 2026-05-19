import React, { useRef, useCallback, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Image, Undo2, Redo2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
}

const toolbarBtn = "p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer border-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your analysis here...',
  maxLength = 5000,
  minHeight = 160,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    updateState();
    const html = editorRef.current?.innerHTML ?? '';
    onChange(html);
  }, [onChange]);

  const updateState = () => {
    const el = editorRef.current;
    if (!el) return;
    setCanUndo(document.queryCommandEnabled('undo'));
    setCanRedo(document.queryCommandEnabled('redo'));

    if (value.length > maxLength) {
      el.innerHTML = value.slice(0, maxLength);
    }
  };

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    if (html.length > maxLength) {
      el.innerHTML = html.slice(0, maxLength);
    }
    onChange(el.innerHTML);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) exec('insertImage', url);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-tertiary)', border: 'var(--border-subtle)' }}>
      <div className="flex items-center gap-0.5 p-1.5 border-b" style={{ borderColor: 'var(--bg-border)', background: 'var(--bg-surface)' }}>
        <button className={toolbarBtn} onClick={() => exec('bold')} title="Bold"><Bold size={14} /></button>
        <button className={toolbarBtn} onClick={() => exec('italic')} title="Italic"><Italic size={14} /></button>
        <button className={toolbarBtn} onClick={() => exec('underline')} title="Underline"><Underline size={14} /></button>
        <span className="w-px h-4 mx-1" style={{ background: 'var(--bg-border)' }} />
        <button className={toolbarBtn} onClick={() => exec('insertUnorderedList')} title="Bullet List"><List size={14} /></button>
        <button className={toolbarBtn} onClick={() => exec('insertOrderedList')} title="Numbered List"><ListOrdered size={14} /></button>
        <span className="w-px h-4 mx-1" style={{ background: 'var(--bg-border)' }} />
        <button className={toolbarBtn} onClick={insertLink} title="Insert Link"><LinkIcon size={14} /></button>
        <button className={toolbarBtn} onClick={insertImage} title="Insert Image"><Image size={14} /></button>
        <span className="w-px h-4 mx-1" style={{ background: 'var(--bg-border)' }} />
        <button className={toolbarBtn} onClick={() => exec('undo')} disabled={!canUndo} title="Undo"><Undo2 size={14} /></button>
        <button className={toolbarBtn} onClick={() => exec('redo')} disabled={!canRedo} title="Redo"><Redo2 size={14} /></button>
        <span className="flex-1" />
        <span className="text-[10px] font-mono" style={{ color: value.length > maxLength * 0.9 ? 'var(--fail)' : 'var(--text-tertiary)' }}>
          {value.length}/{maxLength}
        </span>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        style={{
          minHeight: `${minHeight}px`,
          padding: '12px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: 'var(--text-primary)',
          outline: 'none',
          cursor: 'text',
        }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-tertiary);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
