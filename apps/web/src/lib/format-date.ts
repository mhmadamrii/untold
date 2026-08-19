const DAY = 24 * 60 * 60 * 1000;

export function formatRelativeDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / DAY);

  if (diffDays <= 0) {
    return 'today';
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? 'a week ago' : `${weeks} weeks ago`;
  }
  const months = Math.floor(diffDays / 30);
  return months === 1 ? 'a month ago' : `${months} months ago`;
}
