import { z } from 'zod';

export const UpdateTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(['open', 'closed', 'resolved', 'in_progress']),
});
