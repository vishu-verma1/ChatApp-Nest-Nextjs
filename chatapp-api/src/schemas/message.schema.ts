import { z } from 'zod';

export const messageSchema = z.object({
  content: z.string().max(3000),
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  timestamp: z.date().optional(),
});

