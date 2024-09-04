import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';

import { OpenAI } from 'openai';

import { getLogger } from '@kit/shared/logger';

import { Database } from '~/lib/database.types';

export function createCustomerTicketService(client: SupabaseClient<Database>) {
  return new CustomerTicketService(client);
}

class CustomerTicketService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async generateTicketTitle(message: string) {
    try {
      const openAI = new OpenAI();

      const response = await openAI.completions.create({
        model: 'gpt-3.5-turbo',
        prompt: `Generate a short (under 10 words) title for a support ticket based on the following message: "${message}"`,
        max_tokens: 10,
      });

      return response.choices[0]?.text ?? 'New ticket';
    } catch (error) {
      console.warn(`Failed to generate ticket title: ${error}`);

      return 'New ticket';
    }
  }

  async getTicketMessages(params: {
    ticketId: string;
    lastCreatedAt?: string;
  }) {
    let query = this.client
      .from('messages')
      .select(
        `
        id,
        ticketId: ticket_id,
        content,
        author,
        createdAt: created_at
        `,
      )
      .eq('ticket_id', params.ticketId)
      .order('created_at', { ascending: true });

    if (params.lastCreatedAt) {
      query = query.gt('created_at', params.lastCreatedAt);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  }

  async createTicket(params: { accountId: string; message: string }) {
    const logger = await getLogger();

    logger.info(params, 'Creating ticket...');

    const title = await this.generateTicketTitle(params.message);

    const ticket = await this.client
      .from('tickets')
      .insert({
        account_id: params.accountId,
        title,
      })
      .select('id')
      .single();

    if (ticket.error) {
      logger.error({ error: ticket.error }, 'Error creating ticket');

      throw ticket.error;
    }

    // create message
    const { data, error } = await this.client
      .from('messages')
      .insert({
        ticket_id: ticket.data.id,
        content: params.message,
        author: 'customer',
      })
      .select(
        `
          ticketId: ticket_id,
          content,
          author,
          createdAt: created_at
        `,
      )
      .single();

    if (error) {
      logger.error({ error }, 'Error creating message');

      throw error;
    }

    return data;
  }

  async createMessage(params: { ticketId: string; message: string }) {
    const logger = await getLogger();

    logger.info(params, 'Creating message...');

    const { data, error } = await this.client
      .from('messages')
      .insert({
        ticket_id: params.ticketId,
        content: params.message,
        author: 'customer',
      })
      .select(
        `
          ticketId: ticket_id,
          content,
          author,
          createdAt: created_at
        `,
      )
      .single();

    if (error) {
      logger.error(
        { error, ticketId: params.ticketId },
        'Error creating message',
      );

      throw error;
    }

    logger.info(data, 'Message successfully created');

    return data;
  }
}
