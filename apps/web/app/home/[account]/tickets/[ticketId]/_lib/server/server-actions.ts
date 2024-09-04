'use server';

import { revalidatePath } from 'next/cache';

import { enhanceAction } from '@kit/next/actions';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { UpdateTicketAssigneeSchema } from '../../_lib/schema/update-ticket-assignee.schema';
import { UpdateTicketPrioritySchema } from '../../_lib/schema/update-ticket-priority.schema';
import { MessageFormSchema } from '../schema/message-form.schema';
import { UpdateTicketStatusSchema } from '../schema/update-ticket-status.schema';

export const insertTicketMessageAction = enhanceAction(
  async (data, user) => {
    const logger = await getLogger();
    const client = getSupabaseServerClient();

    logger.info({ data }, 'Inserting ticket message...');

    const response = await client
      .from('messages')
      .insert({
        content: data.message,
        ticket_id: data.ticketId,
        author_account_id: user.id,
        author: 'support',
      })
      .select('*, account: author_account_id (email, picture_url, name)')
      .single();

    if (response.error) {
      logger.error(
        { error: response.error.message },
        'Error inserting ticket message',
      );

      throw new Error(response.error.message);
    }

    return response.data;
  },
  {
    auth: true,
    schema: MessageFormSchema,
  },
);

export const updateTicketStatusAction = enhanceAction(
  async (data) => {
    const logger = await getLogger();
    const client = getSupabaseServerClient();

    logger.info({ data }, 'Updating ticket status...');

    const response = await client
      .from('tickets')
      .update({
        status: data.status,
      })
      .eq('id', data.ticketId)
      .single();

    if (response.error) {
      logger.error(
        { error: response.error.message },
        'Error updating ticket status',
      );

      throw new Error(response.error.message);
    }

    revalidatePath(`/home/[account]/tickets/[ticket]`, 'page');

    return response.data;
  },
  {
    auth: true,
    schema: UpdateTicketStatusSchema,
  },
);

export const updateTicketPriorityAction = enhanceAction(
  async (data) => {
    const logger = await getLogger();
    const client = getSupabaseServerClient();

    logger.info({ data }, 'Updating ticket priority...');

    const response = await client
      .from('tickets')
      .update({
        priority: data.priority,
      })
      .eq('id', data.ticketId)
      .single();

    if (response.error) {
      logger.error(
        { error: response.error.message },
        'Error updating ticket priority',
      );

      throw new Error(response.error.message);
    }

    revalidatePath(`/home/[account]/tickets/[ticket]`, 'page');

    return response.data;
  },
  {
    auth: true,
    schema: UpdateTicketPrioritySchema,
  },
);

export const updateTicketAssigneeAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const logger = await getLogger();

    logger.info({ data }, 'Updating ticket assignee...');

    const response = await client
      .from('tickets')
      .update({
        assigned_to: data.assigneeId,
      })
      .eq('id', data.ticketId)
      .single();

    if (response.error) {
      logger.error(
        { error: response.error.message },
        'Error updating ticket assignee',
      );

      throw new Error(response.error.message);
    }

    revalidatePath(`/home/[account]/tickets/[ticket]`, 'page');

    return response.data;
  },
  {
    auth: true,
    schema: UpdateTicketAssigneeSchema,
  },
);
