import { use } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PageBody, PageHeader } from '@kit/ui/page';

import { createTicketsService } from '~/lib/server/tickets/tickets.service';

import { TicketsDataTable } from './_components/tickets-data-table';

interface TicketsPageProps {
  params: {
    account: string;
  };

  searchParams: {
    page?: string;
    query?: string;
  };
}

export default function TicketsPage(props: TicketsPageProps) {
  const client = getSupabaseServerClient();
  const service = createTicketsService(client);

  const page = Number(props.searchParams.page ?? '1');
  const query = props.searchParams.query ?? '';

  const { data, pageSize, pageCount } = use(
    service.getTickets({
      accountSlug: props.params.account,
      page,
      query,
    }),
  );

  return (
    <>
      <PageHeader
        title={'Support Tickets'}
        description={
          'Here is the list of the support tickets from your customers'
        }
      />

      <PageBody>
        <TicketsDataTable
          pageIndex={page - 1}
          pageCount={pageCount}
          pageSize={pageSize}
          data={data}
        />
      </PageBody>
    </>
  );
}
