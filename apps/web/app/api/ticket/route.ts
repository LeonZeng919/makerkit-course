import { NextResponse } from 'next/server';

import { literal, z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { createCustomerTicketService } from './_lib/server/customer-ticket.service';

const NewMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  accountId: z.string().uuid(),
  ticketId: z.string().uuid().or(literal('')),
});

export const OPTIONS = () => {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': '*',
      },
    },
  );
};

export const POST = enhanceRouteHandler(
  async ({ body }) => {
    const client = getSupabaseServerAdminClient();

    const { message, ticketId, accountId } = body;
    const service = createCustomerTicketService(client);

    const newMessage = ticketId
      ? await service.createMessage({
          ticketId,
          message,
        })
      : await service.createTicket({
          accountId,
          message,
        });

    return NextResponse.json(newMessage, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
  {
    schema: NewMessageSchema,
    auth: false,
  },
);
