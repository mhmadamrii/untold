'use client';

import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { ORPCError } from '@orpc/client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@untold/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@untold/ui/components/dialog';
import { Textarea } from '@untold/ui/components/textarea';
import { cn } from '@untold/ui/lib/utils';
import {
  ChevronDownIcon,
  GripVertical,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { toast } from 'sonner';

import { orpc } from '@/utils/orpc';

export type NoteItem = { id: string; content: string };

export type NotesPanelHandle = {
  openComposerWithPrompt: (text: string) => void;
  triggerGenerateDraft: () => void;
  switchToAsk: () => void;
};

type ActiveTab = 'notes' | 'synopsis' | 'ask';

const TABS: Array<{ key: ActiveTab; label: string }> = [
  { key: 'notes', label: 'Notes' },
  { key: 'synopsis', label: 'Synopsis' },
  { key: 'ask', label: 'Ask' },
];

const ASK_SCOPES = ['Selection', 'Chapter', 'Whole story'] as const;
type AskScope = (typeof ASK_SCOPES)[number];

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const copy = array.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function NoteRow({
  note,
  index,
  onCommit,
  onDelete,
}: {
  note: NoteItem;
  index: number;
  onCommit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: note.id,
    index,
  });
  const [content, setContent] = useState(note.content);

  // Only resync from the server when a different note is swapped in here
  // (reorder), not on every parent re-render, or in-progress edits would
  // get overwritten while the user is typing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on note.id only
  useEffect(() => {
    setContent(note.content);
  }, [note.id]);

  return (
    <div
      ref={ref}
      className={cn(
        'flex gap-2 rounded-md border border-border bg-card p-3',
        isDragging && 'opacity-50',
      )}
    >
      <button
        ref={handleRef}
        type='button'
        className='mt-1 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing'
        aria-label='Drag to reorder'
      >
        <GripVertical className='size-4' />
      </button>
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onBlur={() => {
          const trimmed = content.trim();
          if (trimmed && trimmed !== note.content) {
            onCommit(note.id, trimmed);
          } else if (!trimmed) {
            setContent(note.content);
          }
        }}
        className='min-h-16 flex-1 resize-none border-none bg-transparent p-0 text-sm focus-visible:ring-0'
      />
      <button
        type='button'
        onClick={() => onDelete(note.id)}
        className='mt-1 shrink-0 text-muted-foreground hover:text-destructive'
        aria-label='Delete note'
      >
        <Trash2Icon className='size-3.5' />
      </button>
    </div>
  );
}

export const NotesPanel = forwardRef<
  NotesPanelHandle,
  {
    storyId: string;
    chapterId: string;
    chapterLabel: string;
    notes: NoteItem[];
    description: string | null;
    chapterCount: number;
    totalNotesCount: number;
    onNotesChanged: () => void;
    onUseProposal: (text: string) => void;
    onEditProposal: () => void;
  }
>(function NotesPanel(
  {
    storyId,
    chapterId,
    chapterLabel,
    notes,
    description,
    chapterCount,
    totalNotesCount,
    onNotesChanged,
    onUseProposal,
    onEditProposal,
  },
  ref,
) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('notes');

  const [localNotes, setLocalNotes] = useState(notes);
  const [proposal, setProposal] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftText, setDraftText] = useState('');

  const [showSynopsis, setShowSynopsis] = useState(Boolean(description));
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const [synopsisDraft, setSynopsisDraft] = useState(description ?? '');
  const [askDraft, setAskDraft] = useState('');
  const [askScope, setAskScope] = useState<AskScope>('Chapter');

  // Resync only when the server description changes underneath us (a fresh
  // regenerate, or another tab's edit) — not on every render, or an
  // in-progress edit would get clobbered while the user is typing.
  useEffect(() => {
    setSynopsisDraft(description ?? '');
    if (description) {
      setShowSynopsis(true);
    }
  }, [description]);

  const notesKey = notes.map((note) => note.id).join(',');
  // Resync only when the set/order of note ids changes (add, delete, or a
  // reorder echoed back from the server) — not on every notes.map() call,
  // which would otherwise fight with in-flight local drag reordering.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on notesKey only
  useEffect(() => {
    setLocalNotes(notes);
  }, [notesKey]);

  const createNote = useMutation(
    orpc.note.create.mutationOptions({
      onSuccess: () => {
        setDraftText('');
        setDialogOpen(false);
        onNotesChanged();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateNote = useMutation(
    orpc.note.update.mutationOptions({
      onSuccess: () => onNotesChanged(),
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteNote = useMutation(
    orpc.note.delete.mutationOptions({
      onSuccess: () => onNotesChanged(),
      onError: (error) => toast.error(error.message),
    }),
  );

  const reorderNotes = useMutation(
    orpc.note.reorder.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
        // Roll back to the server's order since the optimistic local order
        // was rejected (or a note was deleted mid-drag).
        onNotesChanged();
      },
    }),
  );

  const generateDraft = useMutation(
    orpc.ai.generateDraft.mutationOptions({
      onSuccess: (data) => {
        setAiUnavailable(false);
        setProposal(data.draft);
      },
      onError: (error) => {
        if (
          error instanceof ORPCError &&
          error.code === 'PRECONDITION_FAILED'
        ) {
          setAiUnavailable(true);
          toast.error("AI isn't set up for this project yet.");
          return;
        }
        toast.error(error.message);
      },
    }),
  );

  const createSynopsis = useMutation(
    orpc.ai.createSynopsis.mutationOptions({
      onSuccess: () => {
        setAiUnavailable(false);
        onNotesChanged();
      },
      onError: (error) => {
        if (
          error instanceof ORPCError &&
          error.code === 'PRECONDITION_FAILED'
        ) {
          setAiUnavailable(true);
          toast.error("AI isn't set up for this project yet.");
          return;
        }
        toast.error(error.message);
      },
    }),
  );

  const updateStoryDescription = useMutation(
    orpc.story.update.mutationOptions({
      onSuccess: () => {
        setEditingSynopsis(false);
        onNotesChanged();
        toast.success('Synopsis updated');
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  useImperativeHandle(ref, () => ({
    openComposerWithPrompt(text) {
      setActiveTab('notes');
      setDraftText(text);
      setDialogOpen(true);
    },
    triggerGenerateDraft() {
      setActiveTab('notes');
      if (localNotes.length === 0) {
        toast.error('Add a note first, Untold needs something to work with.');
        return;
      }
      generateDraft.mutate({ chapterId });
    },
    switchToAsk() {
      setActiveTab('ask');
    },
  }));

  function handleAddNote() {
    const trimmed = draftText.trim();
    if (!trimmed) {
      return;
    }
    createNote.mutate({ chapterId, content: trimmed });
  }

  function handleSaveSynopsis() {
    updateStoryDescription.mutate({
      id: storyId,
      description: synopsisDraft.trim(),
    });
  }

  function handleAskSubmit() {
    if (!askDraft.trim()) {
      return;
    }
    toast("Ask isn't available yet, coming soon.");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source, target } = event.operation;
    if (!source || !target || source.id === target.id) {
      return;
    }
    setLocalNotes((prev) => {
      const oldIndex = prev.findIndex((note) => note.id === source.id);
      const newIndex = prev.findIndex((note) => note.id === target.id);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      const next = arrayMove(prev, oldIndex, newIndex);
      reorderNotes.mutate({ chapterId, noteIds: next.map((note) => note.id) });
      return next;
    });
  }

  function handleUseProposal() {
    if (!proposal) {
      return;
    }
    onUseProposal(proposal);
    setProposal(null);
  }

  const synopsisWordCount = countWords(description ?? '');

  return (
    <>
      <div className='flex-1 overflow-y-auto p-4 lg:p-6'>
        <div className='flex items-center justify-between gap-2'>
          <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
            Companion
          </p>
          <span className='flex items-center gap-0.5 text-xs text-muted-foreground'>
            {chapterLabel}
            <ChevronDownIcon className='size-3' />
          </span>
        </div>

        <div className='mt-4 flex items-center gap-6'>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type='button'
              aria-pressed={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'cn-font-heading rounded-md border px-4 py-1.5 text-sm transition-colors',
                activeTab === tab.key
                  ? 'border-primary/40 bg-primary/5 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {aiUnavailable && (
          <p className='mt-3 text-xs text-muted-foreground'>
            AI isn't set up for this project yet.
          </p>
        )}

        {activeTab === 'notes' && (
          <>
            {proposal && (
              <div className='mt-4 rounded-md border border-primary/30 bg-primary/10 p-4'>
                <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                  Proposal
                </p>
                <p className='cn-font-reading mt-2 text-sm'>{proposal}</p>
                <div className='mt-3 flex flex-wrap gap-2'>
                  <Button size='sm' onClick={handleUseProposal}>
                    Use it
                  </Button>
                  <Button size='sm' variant='outline' onClick={onEditProposal}>
                    Edit
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setProposal(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            <div className='mt-4 flex items-center justify-between gap-2'>
              <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                Notes for this chapter
              </p>
              <span className='text-xs text-muted-foreground'>
                {localNotes.length}
              </span>
              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) {
                    setDraftText('');
                  }
                }}
              >
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle className='cn-font-heading text-xl font-semibold'>
                      Add a note
                    </DialogTitle>
                    <p className='text-xs text-muted-foreground'>
                      A memory, a line of dialogue, a fact to keep straight.
                    </p>
                  </DialogHeader>
                  <Textarea
                    value={draftText}
                    onChange={(event) => setDraftText(event.target.value)}
                    placeholder='A memory, a line of dialogue, a fact to keep straight…'
                    className='min-h-32 text-sm'
                    autoFocus
                  />
                  <DialogFooter>
                    <DialogClose render={<Button variant='outline' />}>
                      Cancel
                    </DialogClose>
                    <Button
                      onClick={handleAddNote}
                      disabled={!draftText.trim() || createNote.isPending}
                    >
                      {createNote.isPending ? 'Adding…' : 'Add note'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {localNotes.length === 0 ? (
              <p className='mt-3 text-xs text-muted-foreground'>
                Notes you add here are what Untold reads from to generate this
                chapter's draft.
              </p>
            ) : (
              <DragDropProvider onDragEnd={handleDragEnd}>
                <div className='mt-3 flex flex-col gap-2'>
                  {localNotes.map((note, index) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      index={index}
                      onCommit={(id, content) =>
                        updateNote.mutate({ id, content })
                      }
                      onDelete={(id) => deleteNote.mutate({ id })}
                    />
                  ))}
                </div>
              </DragDropProvider>
            )}

            <Button
              variant='outline'
              size='sm'
              className='mt-3 w-full'
              onClick={() => setDialogOpen(true)}
            >
              <PlusIcon className='size-3.5' />
              Add new note
            </Button>
          </>
        )}

        {activeTab === 'synopsis' && (
          <div className='mt-4'>
            <div className='flex items-center justify-between gap-2'>
              <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                Synopsis
              </p>
              <span className='text-xs text-muted-foreground'>Story level</span>
            </div>
            <p className='mt-2 text-xs text-muted-foreground'>
              The few lines readers see on your story card and in Discover.
              Written from your chapters and notes, edit it freely.
            </p>

            {showSynopsis ? (
              <div className='mt-3 rounded-md border border-primary/30 bg-primary/10 p-4'>
                {editingSynopsis ? (
                  <Textarea
                    value={synopsisDraft}
                    onChange={(event) => setSynopsisDraft(event.target.value)}
                    className='min-h-24 resize-none border-none bg-transparent p-0 text-sm focus-visible:ring-0'
                    autoFocus
                  />
                ) : (
                  <p className='cn-font-reading text-sm'>{description}</p>
                )}
                <p className='mt-3 text-xs text-muted-foreground'>
                  {synopsisWordCount} words · from {chapterCount}{' '}
                  {chapterCount === 1 ? 'chapter' : 'chapters'},{' '}
                  {totalNotesCount} {totalNotesCount === 1 ? 'note' : 'notes'}
                </p>
                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  {editingSynopsis ? (
                    <>
                      <Button
                        size='sm'
                        onClick={handleSaveSynopsis}
                        disabled={updateStoryDescription.isPending}
                      >
                        {updateStoryDescription.isPending ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => {
                          setEditingSynopsis(false);
                          setSynopsisDraft(description ?? '');
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size='sm'
                        onClick={() =>
                          toast.success(
                            'This synopsis is live on your story card.',
                          )
                        }
                      >
                        Use it
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setEditingSynopsis(true)}
                      >
                        Edit
                      </Button>
                      <button
                        type='button'
                        onClick={() => setShowSynopsis(false)}
                        className='text-xs text-primary hover:underline'
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className='mt-3 text-xs text-muted-foreground'>
                No synopsis yet, generate one below from your chapters and
                notes.
              </p>
            )}
          </div>
        )}

        {activeTab === 'ask' && (
          <div className='mt-4'>
            <Textarea
              value={askDraft}
              onChange={(event) => setAskDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleAskSubmit();
                }
              }}
              placeholder='Ask, or paste a fragment…'
              className='min-h-16 resize-none text-sm'
            />
            <div className='mt-2 flex flex-wrap gap-2'>
              {ASK_SCOPES.map((scope) => (
                <Button
                  key={scope}
                  type='button'
                  size='sm'
                  variant={askScope === scope ? 'default' : 'outline'}
                  onClick={() => setAskScope(scope)}
                >
                  {scope}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className='border-t border-border p-4 lg:p-6'>
        {activeTab === 'notes' && (
          <Button
            className='w-full'
            onClick={() => generateDraft.mutate({ chapterId })}
            disabled={generateDraft.isPending || localNotes.length === 0}
          >
            {generateDraft.isPending ? 'Thinking…' : 'Generate a draft'}
          </Button>
        )}
        {activeTab === 'synopsis' && (
          <Button
            className='w-full'
            onClick={() => createSynopsis.mutate({ storyId })}
            disabled={createSynopsis.isPending || totalNotesCount === 0}
          >
            {createSynopsis.isPending
              ? showSynopsis
                ? 'Regenerating…'
                : 'Writing…'
              : showSynopsis
                ? 'Regenerate synopsis'
                : 'Generate a synopsis'}
          </Button>
        )}
        {activeTab === 'ask' && (
          <Button
            className='w-full'
            onClick={handleAskSubmit}
            disabled={!askDraft.trim()}
          >
            Generate
          </Button>
        )}
      </div>
    </>
  );
});
