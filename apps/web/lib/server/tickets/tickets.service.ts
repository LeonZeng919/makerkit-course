import { SupabaseClient } from '@supabase/supabase-js';

import { Database, Tables } from '~/lib/database.types';

export function createTicketsService(client: SupabaseClient<Database>) {
  return new TicketsService(client);
}

class TicketsService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getTicket(params: { ticketId: string; account: string }) {
    const { data, error } = await this.client
      .from('tickets')
      .select<
        string,
        Tables<'tickets'> & {
          account_id: {
            id: string;
            slug: string;
          };
        }
      >('*, account_id !inner (slug, id)')
      .eq('id', params.ticketId)
      .eq('account_id.slug', params.account)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async getTickets(params: {
    accountSlug: string;
    page: number;
    limit?: number;
    query?: string;
  }) {
    const limit = params.limit ?? 10;
    const startOffset = (params.page - 1) * limit;
    const endOffset = startOffset + limit;

    let query = this.client
      .from('tickets')
      .select('*, account_id !inner (slug)', {
        count: 'exact',
      })
      .eq('account_id.slug', params.accountSlug)
      .order('created_at', { ascending: false })
      .range(startOffset, endOffset);

    if (params.query) {
      query = query.textSearch('title', `"${params.query}"`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data ?? [],
      count: count ?? 0,
      pageSize: limit,
      page: params.page,
      pageCount: Math.ceil((count ?? 0) / limit),
    };
  }
}
