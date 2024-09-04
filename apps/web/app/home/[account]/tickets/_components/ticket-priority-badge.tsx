import { Badge } from '@kit/ui/badge';

import { Tables } from '~/lib/database.types';

export function TicketPriorityBadge({
  priority,
}: {
  priority: Tables<'tickets'>['priority'];
}) {
  switch (priority) {
    case 'low':
      return <Badge variant={'outline'}> Low </Badge>;

    case 'medium':
      return <Badge variant={'warning'}> Medium </Badge>;

    case 'high':
      return <Badge variant={'destructive'}> High </Badge>;
  }
}
