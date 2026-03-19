"use client";

import { useState, useReducer, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { detectInput } from '@/lib/input-detector';
import type { SkillDraft } from '@/types/supabase';

// --- State machine types ---

type ModalState =
  | { phase: 'idle' }
  | { phase: 'detecting'; draft: SkillDraft }
  | { phase: 'preview'; draft: SkillDraft }
  | { phase: 'editing'; draft: SkillDraft }
  | { phase: 'submitting'; draft: SkillDraft };

type ModalAction =
  | { type: 'DETECT'; payload: SkillDraft }
  | { type: 'PREVIEW'; payload: SkillDraft }
  | { type: 'EDIT' }
  | { type: 'SUBMIT' }
  | { type: 'RESET' }
  | { type: 'ERROR' };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'DETECT':
      if (state.phase === 'idle') {
        return { phase: 'detecting', draft: action.payload };
      }
      return state;

    case 'PREVIEW':
      if (state.phase === 'detecting') {
        return { phase: 'preview', draft: action.payload };
      }
      return state;

    case 'EDIT':
      if (state.phase === 'preview' && 'draft' in state) {
        return { phase: 'editing', draft: state.draft };
      }
      return state;

    case 'SUBMIT':
      if ((state.phase === 'preview' || state.phase === 'editing') && 'draft' in state) {
        return { phase: 'submitting', draft: state.draft };
      }
      return state;

    case 'RESET':
      return { phase: 'idle' };

    case 'ERROR':
      if (state.phase === 'detecting') {
        return { phase: 'idle' };
      }
      return state;

    default:
      return state;
  }
}

// --- IA interpretation text derivation ---

function getInterpretationText(state: ModalState): string {
  if (state.phase === 'idle') return '';

  if (state.phase === 'detecting') {
    const { draft } = state;
    if (draft.type === 'github_url') return 'Interpreto que quieres registrar una skill desde GitHub. Obteniendo metadata...';
    if (draft.type === 'command') return 'Interpreto que quieres instalar una skill desde el registro. Te preparo una preview.';
    if (draft.type === 'file') return 'Interpreto que quieres registrar una skill desde un archivo. Te preparo una preview.';
    if (draft.type === 'text') return 'Analizando tu descripción...';
    return '';
  }

  if (state.phase === 'preview' || state.phase === 'editing' || state.phase === 'submitting') {
    const { draft } = state;
    if (draft.type === 'github_url') return 'Interpreto que quieres registrar una skill desde GitHub. Te preparo una preview.';
    if (draft.type === 'command') return 'Interpreto que quieres instalar una skill desde el registro. Aquí está la preview.';
    if (draft.type === 'file') return 'Interpreto que quieres registrar una skill desde un archivo. Aquí está la preview.';
    if (draft.type === 'text') {
      if (draft.intent === 'skill_description') return 'Interpreto que quieres registrar una skill propia. Te preparo una preview.';
      if (draft.intent === 'discovery_intent') return 'Interpreto que buscas una skill existente. Discovery disponible en próxima versión.';
    }
    return '';
  }

  return '';
}

// --- Component props ---

interface SmartAddModalProps {
  onClose: () => void;
  onCreated: () => void;
  onToast?: (msg: string) => void;
}

function SmartAddModal({ onClose, onCreated: _onCreated, onToast: _onToast }: SmartAddModalProps) {
  const [state, dispatch] = useReducer(modalReducer, { phase: 'idle' });
  const [inputValue, setInputValue] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);

  const interpretationText = getInterpretationText(state);

  function handleDetect(raw: string) {
    setInlineError(null);
    const result = detectInput(raw);

    if (result.size_error === true) {
      setInlineError('El archivo supera el límite de 500KB. Usa el formulario manual.');
      dispatch({ type: 'ERROR' });
      return;
    }

    dispatch({ type: 'DETECT', payload: result });

    // TODO Plan 02: call /api/skills/detect and /api/skills/metadata for enrichment
    // For now, immediately transition to preview with sync detection result
    dispatch({ type: 'PREVIEW', payload: result });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && inputValue.trim()) {
      handleDetect(inputValue.trim());
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pastedText = event.clipboardData.getData('text');
    if (pastedText.trim()) {
      setTimeout(() => {
        handleDetect(pastedText.trim());
      }, 0);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const raw = `__file__:${file.size}:${file.name}\n${content}`;
      handleDetect(raw);
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-selected
    event.target.value = '';
  }

  const isInputDisabled = state.phase === 'detecting' || state.phase === 'submitting';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
        </DialogHeader>

        {/* Input wrapper with Add button */}
        <div style={{ position: 'relative', marginTop: '16px' }}>
          <input
            ref={mainInputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isInputDisabled}
            placeholder="Paste a GitHub URL, npm command, or describe what you need..."
            style={{
              width: '100%',
              padding: '10px 44px 10px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              boxSizing: 'border-box',
              outline: 'none',
              opacity: isInputDisabled ? 0.6 : 1,
            }}
          />

          {/* Add button popover */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Plus size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-48 p-1"
            >
              {/* Upload file */}
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  fileInputRef.current?.click();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Upload file
              </button>

              {/* Paste URL */}
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  setInputValue('https://github.com/');
                  setTimeout(() => mainInputRef.current?.focus(), 0);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Paste URL
              </button>

              {/* Paste command */}
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  setInputValue('npx skills add ');
                  setTimeout(() => mainInputRef.current?.focus(), 0);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Paste command
              </button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.skill,.txt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* IA interpretation text */}
        <p
          style={{
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-secondary)',
            marginTop: '8px',
            minHeight: '18px',
            transition: 'opacity 200ms ease',
            opacity: interpretationText ? 1 : 0,
          }}
        >
          {interpretationText}
        </p>

        {/* Inline error */}
        {inlineError && (
          <p style={{ fontSize: '12px', color: 'var(--negative)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {inlineError}
            <button
              type="button"
              onClick={() => setInlineError(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--negative)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={12} />
            </button>
          </p>
        )}

        {/* Preview placeholder — Plan 02 fills this */}
        <div style={{ marginTop: '16px', minHeight: '120px' }}>
          {/* Plan 02: SkillPreviewCard renders here when state.phase === 'preview' || state.phase === 'editing' */}
        </div>

        {/* Fill in manually escape hatch */}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            textDecoration: 'underline',
            padding: '4px 0',
          }}
        >
          Fill in manually
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default SmartAddModal;
export { SmartAddModal };
