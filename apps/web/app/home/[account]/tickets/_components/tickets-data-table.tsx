'use client';

import Link from 'next/link';

import { ColumnDef } from '@tanstack/react-table';

import { Button } from '@kit/ui/button';
import { DataTable } from '@kit/ui/enhanced-data-table';

import { Tables } from '~/lib/database.types';

import { TicketPriorityBadge } from './ticket-priority-badge';
import { TicketStatusBadge } from './ticket-status-badge';

type Ticket = Tables<'tickets'>;

export function TicketsDataTable(props: {
  data: Ticket[];
  pageSize: number;
  pageIndex: number;
  pageCount: number;
}) {
  return <DataTable {...props} columns={getColumns()} />;
}

function getColumns(): ColumnDef<Ticket>[] {
  return [
    {
      header: 'Title',
      cell({ row }) {
        const ticket = row.original;

        return (
          <Link className={'hover:underline'} href={`tickets/${ticket.id}`}>
            {ticket.title}
          </Link>
        );
      },
    },
    {
      header: 'Status',
      cell({ row }) {
        const ticket = row.original;

        return <TicketStatusBadge status={ticket.status} />;
      },
    },
    {
      header: 'Priority',
      cell({ row }) {
        const ticket = row.original;

        return <TicketPriorityBadge priority={ticket.priority} />;
      },
    },
    {
      header: 'Created At',
      cell({ row }) {
        const ticket = row.original;
        const date = new Date(ticket.created_at);

        return getDateString(date);
      },
    },
    {
      header: 'Updated At',
      cell({ row }) {
        const ticket = row.original;
        const date = new Date(ticket.updated_at);

        return getDateString(date);
      },
    },
    {
      header: '',
      id: 'actions',
      cell({ row }) {
        return (
          <div className={'flex justify-end'}>
            <Button asChild variant={'outline'}>
              <Link href={`tickets/${row.original.id}`}>View Issue</Link>
            </Button>
          </div>
        );
      },
    },
  ];
}

function getDateString(date: Date) {
  const day = date.toLocaleDateString();
  const time = date.toLocaleTimeString();

  return `${day} at ${time}`;
}
