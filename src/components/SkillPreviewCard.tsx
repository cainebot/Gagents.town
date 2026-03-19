"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SkillDraft } from '@/types/supabase';

interface SkillPreviewCardProps {
  draft: SkillDraft;
  onConfirm: () => void;
  onEdit: () => void;
  confirming?: boolean;
}

function SkillPreviewCard({ draft, onConfirm, onEdit, confirming }: SkillPreviewCardProps) {
  function getOriginBadge() {
    switch (draft.origin) {
      case 'local':
        return <Badge variant="default">Local</Badge>;
      case 'github':
        return <Badge variant="accent">GitHub</Badge>;
      case 'skills_sh':
        return <Badge variant="success">skills.sh</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '12px',
      }}
    >
      {/* Header row: icon + name + description */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '36px', flexShrink: 0, lineHeight: 1 }}>
          {draft.icon ?? '🔧'}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {draft.name ?? 'Untitled Skill'}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginTop: '2px',
              margin: '2px 0 0',
            }}
          >
            {draft.description ?? 'No description detected'}
          </p>
        </div>
      </div>

      {/* Meta row: origin badge + source URL */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
        {getOriginBadge()}
        {draft.source_url && (
          <a
            href={draft.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '280px',
            }}
          >
            {draft.source_url}
          </a>
        )}
      </div>

      {/* Content excerpt (3-line clamp) */}
      {draft.content && (
        <pre
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--surface)',
            borderRadius: '6px',
            padding: '8px 10px',
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {draft.content}
        </pre>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="sm" onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Registrando...' : 'Confirm & Register'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} disabled={confirming}>
          Edit before registering
        </Button>
      </div>
    </div>
  );
}

export { SkillPreviewCard };
export default SkillPreviewCard;
