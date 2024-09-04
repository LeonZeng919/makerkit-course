import { Badge } from '@kit/ui/badge';

import { Tables } from '~/lib/database.types';

export function TicketStatusBadge({
  status,
}: {
  status: Tables<'tickets'>['status'];
}) {
  switch (status) {
    case 'open':
      return <Badge variant={'warning'}>Open</Badge>;

    case 'closed':
      return <Badge variant={'secondary'}>Closed</Badge>;

    case 'resolved':
      return <Badge variant={'success'}>Resolved</Badge>;

    case 'in_progress':
      return <Badge variant={'info'}>In Progress</Badge>;
  }
}
