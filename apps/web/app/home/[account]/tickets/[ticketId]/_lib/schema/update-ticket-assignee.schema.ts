import { z } from 'zod';

export const UpdateTicketAssigneeSchema = z.object({
  ticketId: z.string().uuid(),
  assigneeId: z.string().uuid(),
});
