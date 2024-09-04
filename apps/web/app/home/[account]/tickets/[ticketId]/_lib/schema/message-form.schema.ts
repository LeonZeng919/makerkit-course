import { object, string } from 'zod';

export const MessageFormSchema = object({
  message: string().min(1).max(5000),
  ticketId: string().uuid(),
});
