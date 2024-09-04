import { use } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Badge } from '@kit/ui/badge';
import { Heading } from '@kit/ui/heading';
import { If } from '@kit/ui/if';
import { PageBody } from '@kit/ui/page';

import { createTicketsService } from '~/lib/server/tickets/tickets.service';

import { TicketPriorityBadge } from '../_components/ticket-priority-badge';
import { TicketStatusBadge } from '../_components/ticket-status-badge';
import { TicketDetailsContainer } from './_components/ticket-details-container';
import { TicketMessagesContainer } from './_components/ticket-messages-container';

interface TicketDetailPageProps {
  params: {
    ticketId: string;
    account: string;
  };

  searchParams: {
    page?: string;
  };
}

export default function TicketDetailPage({
  params,
  searchParams,
}: TicketDetailPageProps) {
  const client = getSupabaseServerClient();
  const service = createTicketsService(client);

  const page = Number(searchParams.page ?? '1');

  const ticket = use(
    service.getTicket({
      ticketId: params.ticketId,
      account: params.account,
    }),
  );

  const timeAgo = getTimeAgo(ticket.created_at);

  return (
    <div className={'flex flex-1'}>
      <div
        className={'flex h-screen flex-1 flex-col space-y-8 overflow-y-hidden'}
      >
        <div className={'border-b p-4'}>
          <div className={'flex flex-col space-y-2.5'}>
            <Heading className={'font-semibold'} level={5}>
              {ticket.title}
            </Heading>

            <div className={'flex space-x-2.5'}>
              <Badge variant={'outline'}>Created {timeAgo}</Badge>

              <If condition={ticket.customer_email}>
                <Badge variant={'outline'}>by {ticket.customer_email}</Badge>
              </If>

              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </div>

        <PageBody>
          <TicketMessagesContainer ticketId={ticket.id} page={page} />
        </PageBody>
      </div>

      <div className={'flex h-full w-[25%] flex-col border-l py-4'}>
        <PageBody className={'overflow-y-auto'}>
          <TicketDetailsContainer ticket={ticket} />
        </PageBody>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: string, locale = 'en') {
  let value;

  const diff = (new Date().getTime() - new Date(timestamp).getTime()) / 1000;
  const minutes = Math.floor(diff / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (years > 0) {
    value = rtf.format(0 - years, 'year');
  } else if (months > 0) {
    value = rtf.format(0 - months, 'month');
  } else if (days > 0) {
    value = rtf.format(0 - days, 'day');
  } else if (hours > 0) {
    value = rtf.format(0 - hours, 'hour');
  } else if (minutes > 0) {
    value = rtf.format(0 - minutes, 'minute');
  } else {
    value = rtf.format(0 - diff, 'second');
  }

  return value;
}
