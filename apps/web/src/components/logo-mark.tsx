import { cn } from '@untold/ui/lib/utils';

// Untold's mark: a "U" monogram in the heading serif, outlined rather than
// filled (the brand never fills primary-accent shapes solid, see DESIGN.md).
// Replaces the old raster /logo.png, which read as an illegible smudge at
// the small sizes the wordmark is actually used at.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-primary cn-font-heading text-sm leading-none text-primary',
        className,
      )}
    >
      U
    </span>
  );
}
