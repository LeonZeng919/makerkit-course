import { createContext } from 'react';

export const WidgetContext = createContext({
  isOpen: false,
  setIsOpen: (_: boolean) => {
    //
  },
  ticketId: '',
  setTicketId: (_: string) => {
    //
  },
});
