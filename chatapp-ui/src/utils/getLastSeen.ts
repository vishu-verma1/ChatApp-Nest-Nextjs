import { format } from 'date-fns';

const getLastseebDisplay = (lastseen: string | Date | null | undefined): string => {
  if (!lastseen) {
    return ' '; 
  }

  const lastSeenDate = typeof lastseen === 'string' ? new Date(lastseen) : lastseen;
  const now = new Date();
  const diffInMs = now.getTime() - lastSeenDate.getTime();
  const diffInSeconds = diffInMs / 1000;
  const diffInMinutes = diffInMs / (1000 * 60);
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInSeconds < 60) {
    return 'a few seconds ago';
  }

  if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)} minutes ago`;
  }

  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  }

  return format(lastSeenDate, 'MMMM d, yyyy');
};

export default getLastseebDisplay;