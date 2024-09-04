'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Alert, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
import { cn } from '@kit/ui/utils';

import { Tables } from '~/lib/database.types';

import { MessageFormSchema } from '../_lib/schema/message-form.schema';
import { insertTicketMessageAction } from '../_lib/server/server-actions';

type Message = Tables<'messages'> & {
  account: {
    email: string;
    name: string;
    picture_url: string;
  };
};

export function TicketMessagesContainer(props: {
  ticketId: string;
  page: number;
}) {
  const [state, setState] = useState<{
    page: number;
  }>({
    page: props.page,
  });

  const scrollingDiv = useRef<HTMLDivElement | null>();
  const queryKey = ['ticket-messages', props.ticketId, props.page.toString()];
  const appendMessage = useAppendNewMessage({ queryKey });

  const { status, data } = useFetchTicketMessages({
    ticketId: props.ticketId,
    page: state.page,
    queryKey,
  });

  useEffect(() => {
    if (scrollingDiv.current) {
      scrollingDiv.current.scrollTo({
        top: scrollingDiv.current.scrollHeight,
      });
    }
  }, [data]);

  if (status === 'pending') {
    return (
      <LoadingOverlay fullPage={false}>Loading messages...</LoadingOverlay>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant={'destructive'}>
        <AlertTitle>Error loading messages</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className={'relative flex w-full flex-1 flex-col'}>
      <div
        ref={(ref) => {
          scrollingDiv.current = ref;
        }}
        className={
          'absolute flex h-full w-full flex-col gap-4 overflow-y-auto pb-24'
        }
      >
        {data.pages.map((page) => {
          return page.map((message) => (
            <TicketMessage key={message.id} message={message} />
          ));
        })}
      </div>

      <SendMessageInput
        ticketId={props.ticketId}
        onMessageSent={appendMessage}
      />
    </div>
  );
}

function SendMessageInput({
  onMessageSent,
  ticketId,
}: {
  ticketId: string;
  onMessageSent: (message: Tables<'messages'>) => void;
}) {
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(MessageFormSchema),
    defaultValues: {
      message: '',
      ticketId,
    },
  });

  return (
    <form
      className={'sticky bottom-4 z-10 mt-auto'}
      onSubmit={form.handleSubmit((data) => {
        startTransition(async () => {
          const message = await insertTicketMessageAction(data);

          onMessageSent(message);

          form.reset();
        });
      })}
    >
      <Input
        {...form.register('message')}
        disabled={pending}
        placeholder={'Send a reply...'}
        type="text"
        className={'h-16 border bg-background pr-36 shadow-xl'}
      />

      <Button disabled={pending} className={'absolute right-4 top-3.5'}>
        Send
      </Button>
    </form>
  );
}

function TicketMessage(props: { message: Message }) {
  const author = props.message.author;
  const content = props.message.content;
  const account = props.message.account;

  const alignClassname = cn('flex w-full lg:w-6/12', {
    'self-end justify-end': author === 'support',
    'self-start': author === 'customer',
  });

  const className = cn('rounded-lg w-full border flex gap-4 p-2.5', {
    'bg-primary/5 text-primary-900 dark:bg-primary/90': author === 'support',
  });

  const authorName =
    author === 'customer'
      ? 'Customer'
      : account?.name || account?.email || `Support`;

  const date = new Date(props.message.created_at);

  return (
    <div className={alignClassname}>
      <div className={'flex w-auto max-w-full flex-col gap-2'}>
        <div className={'flex flex-col'}>
          <div className={'text-sm font-medium capitalize'}>{authorName}</div>

          <div>
            <span className={'text-xs text-muted-foreground'}>
              Sent on {date.toLocaleString('en-US')}
            </span>
          </div>
        </div>

        <div className={className}>
          <p className={'inline-block break-words text-sm'}>{content}</p>
        </div>
      </div>
    </div>
  );
}

function useFetchTicketMessages(params: {
  ticketId: string;
  page: number;
  queryKey: string[];
}) {
  const appendMessage = useAppendNewMessage({ queryKey: params.queryKey });
  const client = useSupabase();

  const { ticketId, page } = params;
  const messagesPerPage = 25;

  const queryFn = async () => {
    const startOffset = (page - 1) * messagesPerPage;
    const endOffset = startOffset + messagesPerPage;

    const { data: messages, error } = await client
      .from('messages')
      .select<
        string,
        Message
      >('*, account: author_account_id (email, name, picture_url)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .range(startOffset, endOffset);

    if (error) {
      throw error;
    }

    return messages;
  };

  useEffect(() => {
    const channel = client.channel(`messages-channel-${ticketId}`);

    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          filter: `ticket_id=eq.${ticketId}`,
          table: 'messages',
        },
        (payload) => {
          const message = payload.new as Tables<'messages'>;

          if (message.author === 'customer') {
            appendMessage(message);
          }
        },
      )
      .subscribe();

    return () => {
      void subscription.unsubscribe();
    };
  }, [client, ticketId, appendMessage]);

  return useInfiniteQuery({
    queryKey: params.queryKey,
    queryFn,
    initialPageParam: page,
    getNextPageParam: (lastPage, _, lastPageParam) => {
      if (lastPage.length === 0) {
        return;
      }

      return lastPageParam + 1;
    },
    getPreviousPageParam: (_, __, firstPageParam) => {
      if (firstPageParam <= 1) {
        return;
      }

      return firstPageParam - 1;
    },
  });
}

function useAppendNewMessage(params: { queryKey: string[] }) {
  const queryClient = useQueryClient();
  const { queryKey } = params;

  return useCallback(
    (message: Tables<'messages'>) => {
      queryClient.setQueryData(
        queryKey,
        (data: { pages: Array<Tables<'messages'>[]> }) => {
          // append message to the last page
          const lastPage = [...data.pages[data.pages.length - 1]!, message];

          return {
            ...data,
            // replace the last page
            pages: [...data.pages.slice(0, -1), lastPage],
          };
        },
      );
    },
    [queryClient, queryKey],
  );
}
