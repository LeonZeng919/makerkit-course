import { z } from 'zod';

export const UpdateTicketPrioritySchema = z.object({
  ticketId: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high']),
});
