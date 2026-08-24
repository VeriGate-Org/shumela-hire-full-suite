'use client';

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { apiFetch, refusalMessage } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';

const MAX_NOTE_LENGTH = 2000;

export interface ScreeningNotesHandle {
  /** Load text into the box without saving it, so a draft can be reviewed before it is committed. */
  setDraft: (text: string) => void;
}

interface ScreeningNotesPanelProps {
  applicationId: string | number;
  /** The running record as currently stored. */
  notes?: string;
  onSaved?: (allNotes: string) => void;
  readOnly?: boolean;
}

/**
 * Read and add to the running screening record for one application.
 *
 * <p>The Applied and Screening stages had no way to record anything. Every other stage in the
 * pipeline modal has a panel for the work done there — interviews, offers, verification checks —
 * while the two stages where a recruiter actually forms a view offered a read-only "Screening
 * Notes" block that did not render at all when empty, which is the state every new applicant is
 * in. So the first two columns of the pipeline were, in practice, write-nothing.
 *
 * <p>Notes append rather than replace, and each carries its author and time, because the value of
 * this field is the history of what people thought as a candidate moved.
 */
const ScreeningNotesPanel = forwardRef<ScreeningNotesHandle, ScreeningNotesPanelProps>(
  function ScreeningNotesPanel({ applicationId, notes, onSaved, readOnly = false }, ref) {
    const { toast } = useToast();
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState(notes ?? '');

    useImperativeHandle(ref, () => ({ setDraft: (text: string) => setDraft(text) }), []);

    const handleSave = async () => {
      const note = draft.trim();
      if (!note) return;

      setSaving(true);
      try {
        const response = await apiFetch(`/api/applications/manage/${applicationId}/screening-notes`, {
          method: 'POST',
          body: JSON.stringify({ notes: note }),
        });
        if (!response.ok) throw new Error(await refusalMessage(response));

        const result = await response.json().catch(() => null);
        const updated = typeof result?.screeningNotes === 'string' ? result.screeningNotes : history;
        setHistory(updated);
        setDraft('');
        toast('Note saved', 'success');
        onSaved?.(updated);
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : 'Could not save the note', 'error');
      } finally {
        setSaving(false);
      }
    };

    const overLimit = draft.length > MAX_NOTE_LENGTH;

    return (
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
          Screening Notes &amp; Feedback
        </h4>

        {history ? (
          <div className="mb-3 max-h-40 overflow-y-auto bg-muted/50 rounded-control p-3 border border-border">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{history}</p>
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">
            No notes recorded for this candidate yet.
          </p>
        )}

        {!readOnly && (
          <>
            <label htmlFor={`screening-note-${applicationId}`} className="sr-only">
              Add a note about this candidate
            </label>
            <textarea
              id={`screening-note-${applicationId}`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={3}
              placeholder="Add a note or feedback on this candidate..."
              className="w-full px-3 py-2 text-sm border border-border rounded-control bg-card text-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.12)] outline-none transition-all resize-y"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className={`text-xs ${overLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                {draft.length} / {MAX_NOTE_LENGTH}
              </span>
              <button
                onClick={handleSave}
                disabled={saving || !draft.trim() || overLimit}
                className="inline-flex items-center px-4 py-1.5 rounded-button bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
);

export default ScreeningNotesPanel;
