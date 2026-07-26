// helper function for absolute time
function getAbsoluteTime(date: Date): string {
  const dateStr = date.toLocaleDateString('en-US');
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).replace(' ', '');

  return `${dateStr} ${timeStr}`;
}

// helper function for relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const secs = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (secs < 60) {
    return `${secs} second${secs !== 1 ? 's' : ''} ago`;
  }

  const mins = Math.floor(secs / 60);
  if (mins < 60) {
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  }

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// the post date combining both relative and absolute time
export function formatPostDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return `${getAbsoluteTime(date)} (${getRelativeTime(date)})`;
}
