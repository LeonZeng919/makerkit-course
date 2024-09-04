-- insert new permissions
alter type public.app_permissions add value 'tickets.update';
alter type public.app_permissions add value 'tickets.delete';
commit;

-- grant permissions to the owner role
insert into public.role_permissions(
  role,
  permission)
values
  ('owner', 'tickets.update'),
  ('owner', 'tickets.delete');

--  public.message_author: enum type for message author
create type public.message_author as enum ('support', 'customer');

-- public.ticket_status: enum type for ticket status
create type public.ticket_status as enum ('open', 'closed', 'resolved', 'in_progress');

-- public.ticket_priority: enum type for ticket priority
create type public.ticket_priority as enum ('low', 'medium', 'high');

/*
* Table: public.tickets
-- table for the support tickets
*/
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  title varchar(255) not null,
  category varchar(100) not null default 'general',
  assigned_to uuid references public.accounts(id) on delete set null,
  priority public.ticket_priority not null default 'medium',
  status public.ticket_status not null default 'open',
  customer_email varchar(255),
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid references public.accounts(id) on delete set null,
  closed_at timestamptz,
  closed_by uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.tickets
revoke all on public.tickets from public, service_role;

-- grant required permissions on public.tickets
grant select, insert, update, delete on public.tickets to authenticated;
grant select, insert on public.tickets to service_role;

-- Indexes
create index ix_tickets_account_id on public.tickets(account_id);

-- RLS
alter table public.tickets enable row level security;

-- SELECT(public.tickets)
create policy select_tickets
  on public.tickets
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id)
  );

-- DELETE(public.tickets)
create policy delete_tickets
  on public.tickets
  for delete
  to authenticated
  using (
    public.has_permission((select auth.uid()), account_id, 'tickets.delete'::app_permissions)
  );

 -- UPDATE(public.tickets)
create policy update_tickets
  on public.tickets
  for update
  to authenticated
  using (
    public.has_permission((select auth.uid()), account_id, 'tickets.update'::app_permissions)
  )
  with check (
    public.has_permission((select auth.uid()), account_id, 'tickets.update'::app_permissions)
  );

/*
* Table: public.messages
*/
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author public.message_author not null,
  author_account_id uuid references public.accounts(id) on delete set null,
  content varchar(5000) not null,
  attachment_url varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index ix_messages_ticket_id on public.messages(ticket_id);

-- revoke all permissions from the messages table
revoke all on public.messages from public, service_role;

-- grant permissions to the authenticated role
grant select, insert, update, delete on public.messages to authenticated;

grant select, insert on public.messages to service_role;

-- RLS
alter table public.messages enable row level security;

-- Function: public.has_role_on_ticket_account
-- Description: Check if the authenticated user has a role on the account of the ticket
create or replace function public.has_role_on_ticket_account(ticket_id uuid)
  returns boolean
  set search_path = ''
  as $$
  begin
    return exists (
      select 1
      from public.tickets ticket
      where ticket.id = ticket_id
      and public.has_role_on_account(ticket.account_id)
    );
  end;
  $$ language plpgsql stable;

grant execute on function public.has_role_on_ticket_account(uuid) to authenticated;

-- SELECT(public.messages)
create policy select_messages
  on public.messages
  for select
  to authenticated
  using (
    public.has_role_on_ticket_account(ticket_id)
  );

-- UPDATE(public.messages)
create policy update_messages
  on public.messages
  for update
  to authenticated
  using (
    public.has_role_on_ticket_account(ticket_id)
  )
  with check (
    public.has_role_on_ticket_account(ticket_id)
  );

-- DELETE(public.messages)
create policy delete_messages
  on public.messages
  for delete
  to authenticated
  using (
    public.has_role_on_ticket_account(ticket_id)
  );

-- INSERT(public.messages)
create policy insert_messages
  on public.messages
  for insert
  to authenticated
  with check (
    public.has_role_on_ticket_account(ticket_id)
  );

-- public.plans: table for subscription plans
create table if not exists public.plans (
  variant_id varchar(255) primary key,
  name varchar(255) not null,
  max_tickets int not null
);

-- revoke all permissions from the plans table
revoke all on public.plans from public, service_role;

-- grant permissions to the authenticated role
grant select on public.plans to authenticated, service_role;

-- RLS
alter table public.plans enable row level security;

-- SELECT(public.plans)
create policy select_plans
  on public.plans
  for select
  to authenticated
  using (true);

/*
* Bucket: attachments
*/
insert into
  storage.buckets (id, name, PUBLIC)
values
  ('attachments', 'attachments', false);

-- Function public.can_read_message
-- Description: Check if the authenticated user can read the message
create or replace function public.can_read_message (message_id uuid)
  returns boolean
  set search_path = ''
  as $$
  begin
    return exists (
      select 1
      from public.messages message
      where message.id = message_id
      and public.has_role_on_ticket_account(message.ticket_id)
    );
  end;
  $$ language plpgsql stable;

grant execute on function public.can_read_message(uuid) to authenticated;

-- RLS policies for storage
create policy message_attachments
  on storage.objects
  for select
  to authenticated using (
    bucket_id = 'attachments'
    and public.can_read_message(
      kit.get_storage_filename_as_uuid (name)
    )
);

-- Function to handle status changes
create or replace function kit.handle_ticket_status_change()
returns trigger
set search_path = ''
as $$
begin
  if new.status = 'closed' and old.status != 'closed' then
    new.closed_by := auth.uid();
    new.closed_at := now();
    new.resolved_by := null;
    new.resolved_at := null;
  elsif new.status = 'resolved' and old.status != 'resolved' then
    new.resolved_by := auth.uid();
    new.resolved_at := now();
    new.closed_by := null;
    new.closed_at := null;
  elsif new.status = 'open' and old.status != 'open' then
    new.closed_by := null;
    new.closed_at := null;
    new.resolved_by := null;
    new.resolved_at := null;
  elsif new.status = 'in_progress' and old.status != 'in_progress' then
    new.closed_by := null;
    new.closed_at := null;
    new.resolved_by := null;
    new.resolved_at := null;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to handle status changes
create trigger handle_ticket_status_change_trigger
before update of status on public.tickets
for each row
when (old.status is distinct from new.status)
execute function kit.handle_ticket_status_change();

create
or replace function public.get_subscription_details (target_account_id uuid) returns table (
  variant_id varchar,
  period_starts_at timestamptz,
  period_ends_at timestamptz
)
set search_path = ''
as $$
begin
  -- select the subscription details for the target account
  return query select
        item.variant_id,
        subscription.period_starts_at,
        subscription.period_ends_at
  from
        public.subscription_items as item
  join
        public.subscriptions as subscription
  on
        subscription.id = item.subscription_id
  where
        subscription.account_id = target_account_id
  and   subscription.active = true
  and
        item.type = 'flat';
end;
$$ language plpgsql;

grant execute on function public.get_subscription_details(uuid) to authenticated, service_role;

create
or replace function public.check_ticket_limit () returns trigger
set search_path = ''
as $$
declare
  subscription record;
  ticket_count int;
  max_tickets int;
begin
  -- get the subscription details for the account
  select *
    into subscription
    from public.get_subscription_details(NEW.account_id);

  -- is the user on a free plan?
  if subscription is null then
    select count(*)
      into ticket_count
      from public.tickets
      where account_id = NEW.account_id and
      created_at >= now() - interval '30 days';

    -- check if the user has exceeded the limit
    if ticket_count >= 50 then
      raise exception 'You have reached the maximum number of tickets allowed for your plan';
    end if;

    -- allow the user to create the ticket
    return NEW;
  end if;

  -- get the max tickets allowed for the plan
  select max_tickets
    into max_tickets
    from public.plans
    where variant_id = subscription.variant_id;

  -- Unlimited tickets for the plan, so allow the user to create the ticket
  if max_tickets = -1 then
    return NEW;
  end if;

  -- check the number of tickets created during the billing period
  select count(*)
    into ticket_count
    from public.tickets
    where account_id = NEW.account_id and
    created_at >= subscription.period_starts_at and
    created_at <= subscription.period_ends_at;

  if ticket_count >= max_tickets then
    raise exception 'You have reached the maximum number of tickets allowed for your plan';
  end if;

  return NEW;
end;
$$ language plpgsql;

create or replace trigger check_ticket_limit
before insert on public.tickets
for each row
execute function public.check_ticket_limit ();

create or replace function public.get_remaining_tickets(target_account_id uuid)
returns int
set search_path = ''
as $$
declare
  subscription record;
  ticket_count int;
  max_tickets int;
begin
  select *
    into subscription
    from public.get_subscription_details(target_account_id);

  if subscription is null then
    select count(*)
      into ticket_count
      from public.tickets
      where public.tickets.account_id = target_account_id and
      created_at >= now() - interval '30 days';

    return 50 - ticket_count;
  end if;

  select max_tickets
    into max_tickets
    from public.plans
    where variant_id = subscription.variant_id;

  -- Unlimited tickets
  if max_tickets = -1 then
    return -1;
  end if;

  select count(*)
    into ticket_count
    from public.tickets
    where public.tickets.account_id = target_account_id and
    created_at >= subscription.period_starts_at and
    created_at <= subscription.period_ends_at;

  return max_tickets - ticket_count;
end;
$$ language plpgsql;

grant execute on function public.get_remaining_tickets(uuid) to authenticated, service_role;