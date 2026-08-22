'use client';

import { ORPCError } from '@orpc/client';
import { useMutation } from '@tanstack/react-query';
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
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
import { GripVertical, PlusIcon, Trash2Icon } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { toast } from 'sonner';

import { orpc } from '@/utils/orpc';

export type NoteItem = { id: string; content: string };

export type NotesPanelHandle = {
  openComposerWithPrompt: (text: string) => void;
};

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
    chapterId: string;
    notes: NoteItem[];
    onNotesChanged: () => void;
    onUseProposal: (text: string) => void;
    onEditProposal: () => void;
  }
>(function NotesPanel(
  { chapterId, notes, onNotesChanged, onUseProposal, onEditProposal },
  ref,
) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [proposal, setProposal] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftText, setDraftText] = useState('');

  const notesKey = notes.map((note) => note.id).join(',');
  // Resync only when the set/order of note ids changes (add, delete, or a
  // reorder echoed back from the server) — not on every notes.map() call,
  // which would otherwise fight with in-flight local drag reordering.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on notesKey only
  useEffect(() => {
    setLocalNotes(notes);
  }, [notesKey]);

  useImperativeHandle(ref, () => ({
    openComposerWithPrompt(text) {
      setDraftText(text);
      setDialogOpen(true);
    },
  }));

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

  function handleAddNote() {
    const trimmed = draftText.trim();
    if (!trimmed) {
      return;
    }
    createNote.mutate({ chapterId, content: trimmed });
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

  return (
    <>
      <div className='flex-1 overflow-y-auto p-4 lg:p-6'>
        <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
          Companion
        </p>

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
                  onCommit={(id, content) => updateNote.mutate({ id, content })}
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
      </div>

      <div className='border-t border-border p-4 lg:p-6'>
        {aiUnavailable && (
          <p className='mb-2 text-xs text-muted-foreground'>
            AI isn't set up for this project yet.
          </p>
        )}
        <Button
          className='w-full'
          onClick={() => generateDraft.mutate({ chapterId })}
          disabled={generateDraft.isPending || localNotes.length === 0}
        >
          {generateDraft.isPending ? 'Thinking…' : 'Generate a draft'}
        </Button>
      </div>
    </>
  );
});
