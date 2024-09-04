'use client';

import { useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@kit/ui/form';
import { Heading } from '@kit/ui/heading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { Tables } from '~/lib/database.types';

import { UpdateTicketAssigneeSchema } from '../_lib/schema/update-ticket-assignee.schema';
import { UpdateTicketPrioritySchema } from '../_lib/schema/update-ticket-priority.schema';
import { UpdateTicketStatusSchema } from '../_lib/schema/update-ticket-status.schema';
import {
  updateTicketAssigneeAction,
  updateTicketPriorityAction,
  updateTicketStatusAction,
} from '../_lib/server/server-actions';

export function TicketDetailsContainer({
  ticket,
}: {
  ticket: Tables<'tickets'> & {
    account_id: {
      slug: string;
    };
  };
}) {
  const { account } = useTeamAccountWorkspace();
  const permissions = account.permissions;
  const canUpdateTicket = permissions.includes('tickets.update');

  return (
    <div className={'flex h-screen flex-1 flex-col space-y-8'}>
      <div>
        <Heading level={4}>Ticket details</Heading>

        <Heading level={6} className={'text-muted-foreground'}>
          Manage the status, assignee, and priority of the ticket.
        </Heading>
      </div>

      <div className={'flex flex-1 flex-col space-y-4'}>
        <StatusSelect
          disabled={!canUpdateTicket}
          status={ticket.status}
          ticketId={ticket.id}
        />

        <AssigneeSelect
          disabled={!canUpdateTicket}
          assignee={ticket.assigned_to}
          ticketId={ticket.id}
          accountSlug={ticket.account_id.slug}
        />

        <PrioritySelect
          disabled={!canUpdateTicket}
          priority={ticket.priority}
          ticketId={ticket.id}
        />
      </div>
    </div>
  );
}

function StatusSelect(props: {
  status: Tables<'tickets'>['status'];
  ticketId: string;
  disabled: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(UpdateTicketStatusSchema),
    defaultValues: {
      status: props.status,
      ticketId: props.ticketId,
    },
  });

  const [pending, startTransition] = useTransition();

  return (
    <Form {...form}>
      <FormField
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Status</FormLabel>

              <FormControl>
                <Select
                  value={form.getValues('status')}
                  disabled={pending || props.disabled}
                  onValueChange={(value) => {
                    form.setValue(
                      field.name,
                      value as Tables<'tickets'>['status'],
                      {
                        shouldValidate: true,
                      },
                    );

                    void form.handleSubmit((value) => {
                      startTransition(async () => {
                        await updateTicketStatusAction(value);
                      });
                    })();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={'Status'} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={'open'}>Open</SelectItem>
                    <SelectItem value={'closed'}>Closed</SelectItem>
                    <SelectItem value={'in_progress'}>In Progress</SelectItem>
                    <SelectItem value={'resolved'}>Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>

              <FormDescription>
                The status of the ticket determines its current state.
              </FormDescription>
            </FormItem>
          );
        }}
        name={'status'}
      />
    </Form>
  );
}

function AssigneeSelect(props: {
  assignee: Tables<'tickets'>['assigned_to'];
  ticketId: string;
  accountSlug: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(UpdateTicketAssigneeSchema),
    defaultValues: {
      assigneeId: props.assignee!,
      ticketId: props.ticketId,
    },
  });

  const membersQuery = useFetchMembers(props.accountSlug);
  const members = membersQuery.data ?? [];

  return (
    <Form {...form}>
      <FormField
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Assignee</FormLabel>

              <FormControl>
                <Select
                  value={form.getValues('assigneeId')}
                  disabled={pending || props.disabled || membersQuery.isPending}
                  onValueChange={(value) => {
                    form.setValue(field.name, value, {
                      shouldValidate: true,
                    });

                    void form.handleSubmit((value) => {
                      startTransition(async () => {
                        await updateTicketAssigneeAction(value);
                      });
                    })();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={'Choose an Assignee'} />
                  </SelectTrigger>

                  <SelectContent>
                    {members.map((member) => {
                      return (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name || member.email}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormDescription>
                The person responsible for resolving the ticket.
              </FormDescription>
            </FormItem>
          );
        }}
        name={'assigneeId'}
      />
    </Form>
  );
}

function PrioritySelect(props: {
  priority: Tables<'tickets'>['priority'];
  ticketId: string;
  disabled: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(UpdateTicketPrioritySchema),
    defaultValues: {
      priority: props.priority,
      ticketId: props.ticketId,
    },
  });

  const [pending, startTransition] = useTransition();

  return (
    <Form {...form}>
      <FormField
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Priority</FormLabel>

              <FormControl>
                <Select
                  value={form.getValues('priority')}
                  disabled={pending || props.disabled}
                  onValueChange={(value) => {
                    form.setValue(
                      field.name,
                      value as Tables<'tickets'>['priority'],
                      { shouldValidate: true },
                    );

                    void form.handleSubmit((value) => {
                      startTransition(async () => {
                        await updateTicketPriorityAction(value);
                      });
                    })();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={'Choose Priority'} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={'low'}>Low</SelectItem>
                    <SelectItem value={'medium'}>Medium</SelectItem>
                    <SelectItem value={'high'}>High</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>

              <FormDescription>
                The priority of the ticket determines how quickly it should be
                resolved.
              </FormDescription>
            </FormItem>
          );
        }}
        name={'priority'}
      />
    </Form>
  );
}

function useFetchMembers(accountSlug: string) {
  const supabase = useSupabase();
  const queryKey = ['accounts_memberships', accountSlug];

  const queryFn = async () => {
    const { data, error } = await supabase.rpc('get_account_members', {
      account_slug: accountSlug,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  return useQuery({
    queryKey,
    queryFn,
  });
}
