'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { MessageCircle, Send, X } from 'lucide-react';

import { If } from '@kit/ui/if';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';
import { cn } from '@kit/ui/utils';

import { useWidgetState } from '../lib/use-widget-state';

interface Message {
  id: string;
  ticketId: string;
  author: 'customer' | 'support';
  content: string;
  createdAt: string;
}

const API_URL = process.env.API_URL!;

export default function SupportTicketWidgetContainer(props: {
  accountId: string;
}) {
  const state = useWidgetState();
  const scrollingDiv = useRef<HTMLDivElement>();

  const { messages, appendMessage } = useFetchTicketMessages({
    ticketId: state.ticketId,
    isOpen: state.isOpen,
  });

  const scrollToBottom = () => {
    scrollingDiv.current?.scrollTo({
      top: scrollingDiv.current.scrollHeight,
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      <If condition={state.isOpen}>
        <WidgetContainer>
          <div className={'flex h-full flex-1 flex-col'}>
            <WidgetHeader />

            <div
              ref={(div) => {
                scrollingDiv.current = div as HTMLDivElement;
              }}
              className={'flex flex-1 flex-col overflow-y-auto p-4'}
            >
              <WidgetMessagesContainer messages={messages} />
            </div>

            <WidgetInput
              accountId={props.accountId}
              ticketId={state.ticketId}
              onSubmit={(message) => {
                state.setTicketId(message.ticketId);
                appendMessage(message);
              }}
            />
          </div>
        </WidgetContainer>
      </If>

      <WidgetBubble />
    </>
  );
}

function WidgetHeader() {
  const { setIsOpen } = useWidgetState();

  return (
    <div
      className={
        'flex items-center justify-between border-b px-4 py-3 md:rounded-t-xl'
      }
    >
      <div className={'flex flex-col text-foreground'}>
        <span className={'font-semibold'}>Ask Support</span>
      </div>

      <div className={'flex items-center space-x-4'}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                <X className={'h-4 text-foreground dark:hover:text-white'} />
              </button>
            </TooltipTrigger>

            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

function WidgetContainer(props: React.PropsWithChildren) {
  return (
    <div
      className={cn(
        'fixed z-50 duration-200 animate-in fade-in slide-in-from-bottom-24' +
          ' bg-background font-sans md:rounded-lg' +
          ' h-[60vh] w-full md:w-[40vw] xl:w-[26vw]' +
          ' bottom-0 border shadow-2xl zoom-in-90 md:bottom-36 md:right-8',
      )}
    >
      {props.children}
    </div>
  );
}

function WidgetBubble() {
  const { isOpen, setIsOpen } = useWidgetState();

  const className = cn('bottom-8 md:bottom-16 md:right-8', {
    'hidden md:flex': isOpen,
  });

  const iconClassName = 'w-8 h-8 animate-in fade-in zoom-in';

  const Icon = isOpen ? (
    <X className={iconClassName} />
  ) : (
    <MessageCircle className={iconClassName} />
  );

  return (
    <button
      className={cn(
        'h-16 w-16 rounded-full bg-primary text-primary-foreground animate-out' +
          ' fixed flex items-center justify-center animate-in zoom-in slide-in-from-bottom-16' +
          ' hover:opacity/90 transition-all hover:shadow-xl' +
          ' z-50 duration-500 hover:-translate-y-1 hover:scale-105',
        className,
      )}
      onClick={() => setIsOpen(!isOpen)}
    >
      {Icon}
    </button>
  );
}

function WidgetInput(props: {
  accountId: string;
  ticketId: string | undefined;
  onSubmit: (message: Message) => void;
}) {
  const submitMessage = useSubmitMessage();

  const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();

      const form = e.currentTarget;
      const element = form.elements.namedItem('message') as HTMLInputElement;
      const value = element.value.trim();

      if (!value) {
        return;
      }

      element.value = '';

      void (async () => {
        const message = await submitMessage.mutateAsync({
          accountId: props.accountId,
          ticketId: props.ticketId,
          message: value,
        });

        props.onSubmit(message);
      })();
    },
    [props],
  );

  return (
    <form className={'mt-auto'} onSubmit={onSubmit}>
      <div className={'relative flex'}>
        <input
          disabled={submitMessage.loading}
          autoComplete={'off'}
          required
          name={'message'}
          className={
            'h-14 p-4 text-muted-foreground' +
            ' w-full rounded-bl-xl rounded-br-xl outline-none' +
            ' resize-none border-t text-sm transition-colors' +
            ' bg-background pr-8 focus:text-secondary-foreground'
          }
          placeholder="Type your message..."
        />

        <button
          type={'submit'}
          className={'absolute right-4 top-4 bg-transparent'}
        >
          <Send className={'h-6 text-muted-foreground'} />
        </button>
      </div>
    </form>
  );
}

function WidgetMessagesContainer(props: { messages: Message[] }) {
  if (!props.messages.length) {
    return (
      <div className={'text-center text-muted-foreground'}>
        Please send a message to start a conversation
      </div>
    );
  }

  return (
    <div className={'flex flex-col space-y-5'}>
      {props.messages.map((message) => {
        const name = message.author === 'customer' ? 'You' : 'Support';

        let className = 'p-3 flex flex-col space-y-1 border rounded-lg';

        if (message.author === 'customer') {
          className += ' bg-primary/5 border-primary/10';
        } else {
          className += '';
        }

        return (
          <div className={'flex flex-col space-y-2'} key={message.id}>
            <div className={'px-3'}>
              <b className={'text-sm font-semibold'}>{name}</b>
            </div>

            <div className={className}>
              <div className={'block max-w-full break-words text-sm'}>
                {message.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function useSubmitMessage() {
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: { ticketId: string } | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const mutateAsync = useCallback(
    async (props: {
      accountId: string;
      ticketId: string | undefined;
      message: string;
    }) => {
      setState({ loading: true, error: null, data: null });

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId: props.ticketId ?? undefined,
            accountId: props.accountId,
            message: props.message,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit message');
        }

        const result = (await response.json()) as Message;

        setState({
          loading: false,
          error: null,
          data: result,
        });

        return result;
      } catch {
        setState({
          loading: false,
          error: new Error('Failed to parse response'),
          data: null,
        });

        throw new Error('Failed to parse response');
      }
    },
    [],
  );

  return {
    ...state,
    mutateAsync,
  };
}

function useFetchTicketMessages({
  ticketId,
  isOpen,
}: {
  ticketId: string | undefined;
  isOpen: boolean;
}) {
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    messages: Message[];
  }>({
    loading: true,
    error: null,
    messages: [],
  });

  const messages = state.messages;

  const lastMessage = messages.reduce<Message | undefined>((acc, curr) => {
    if (!acc) return;

    return acc.createdAt > curr.createdAt ? acc : curr;
  }, messages[0]);

  const lastCreatedAt = lastMessage?.createdAt;

  useEffect(() => {
    if (!ticketId || !isOpen) {
      return setState((state) => {
        return {
          ...state,
          loading: false,
          error: null,
        };
      });
    }

    function fetchMessages(lastCreatedAt?: string) {
      setState((state) => ({ ...state, loading: true, error: null }));

      const timestamp = lastCreatedAt
        ? new Date(lastCreatedAt).toISOString()
        : '';

      fetch(
        `${API_URL}/messages?ticketId=${ticketId}&lastCreatedAt=${timestamp}`,
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch messages');
          }

          return response.json() as Promise<Message[]>;
        })
        .then((messages) => {
          const newMessages = messages.filter(
            (message: Message) =>
              !state.messages.some((m) => m.id === message.id),
          );

          setState((state) => ({
            loading: false,
            error: null,
            messages: [...state.messages, ...newMessages],
          }));
        })
        .catch((error) => {
          setState((state) => ({
            ...state,
            loading: false,
            error,
          }));
        });
    }

    // Fetch messages on mount
    fetchMessages();

    // Fetch messages every 10 seconds
    const interval = setInterval(() => {
      fetchMessages(lastCreatedAt);
    }, 10_000);

    return () => clearInterval(interval);
  }, [ticketId, isOpen, lastCreatedAt]);

  return {
    ...state,
    appendMessage: (message: Message) => {
      setState((state) => ({
        ...state,
        messages: [...state.messages, message],
      }));
    },
  };
}
