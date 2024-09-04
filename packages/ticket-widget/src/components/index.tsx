'use client';

import { useEffect, useState } from 'react';

import { WidgetContext } from '../lib/context';
import SupportTicketWidgetContainer from './support-ticket-widget-container';

export default function WidgetContainer(props: { accountId: string }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ticketId, setTicketId] = useState(getTicketIdFromLocalStorage());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const context = {
    isOpen,
    setIsOpen,
    ticketId,
    setTicketId: (ticketId: string) => {
      localStorage.setItem('ticketId', ticketId);
      setTicketId(ticketId);
    },
  };

  return (
    <WidgetContext.Provider value={context}>
      <SupportTicketWidgetContainer accountId={props.accountId} />
    </WidgetContext.Provider>
  );
}

function getTicketIdFromLocalStorage() {
  return localStorage.getItem('ticketId') ?? '';
}
