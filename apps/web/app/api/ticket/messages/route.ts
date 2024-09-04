import { NextResponse } from 'next/server';

import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { createCustomerTicketService } from '../_lib/server/customer-ticket.service';

const GetTicketMessagesSchema = z.object({
  ticketId: z.string().uuid(),
  lastCreatedAt: z
    .string()
    .or(z.literal(''))
    .transform((value) => {
      if (value === 'undefined') {
        return;
      }

      return value;
    }),
});

export const OPTIONS = () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': '*',
    },
  });
};

export const GET = enhanceRouteHandler(
  async ({ request }) => {
    const client = getSupabaseServerAdminClient();

    const searchParams = new URL(request.url).searchParams;

    const params = GetTicketMessagesSchema.parse({
      ticketId: searchParams.get('ticketId') ?? '',
      lastCreatedAt: searchParams.get('lastCreatedAt') ?? '',
    });

    const service = createCustomerTicketService(client);
    const messages = await service.getTicketMessages(params);

    return NextResponse.json(messages, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
  {
    auth: false,
    schema: undefined,
  },
);
