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

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/*
  label for a day divider between groups of messages, e.g. "Today",
  "Yesterday", or "Tuesday, August 15" (with year appended if not this year)
*/
export function formatDayDivider(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();

  if (isSameDay(date, now)) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';

  const options: Intl.DateTimeFormatOptions = date.getFullYear() === now.getFullYear()
    ? { weekday: 'long', month: 'long', day: 'numeric' }
    : {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    };
  return date.toLocaleDateString('en-US', options);
}

// compact timestamp for an inbox row, e.g. "2m", "5h", "Tue", "8/15/26"
export function formatInboxTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const secs = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (secs < 60) return 'now';

  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  if (hours < 24 && isSameDay(date, now)) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });

  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
}

/*
  plain clock time for a message bubble, e.g. "2:45 PM" -- the day is shown
  separately via a day divider, so this never needs to include the date
*/
export function formatClockTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
