import {
  CreditCard,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Users,
} from 'lucide-react';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import featureFlagsConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const getRoutes = (account: string) => [
  {
    label: 'common:routes.dashboard',
    path: pathsConfig.app.accountHome.replace('[account]', account),
    Icon: <LayoutDashboard className={iconClasses} />,
    end: true,
  },
  {
    label: 'Support Tickets',
    collapsible: false,
    path: `/home/${account}/tickets`,
    Icon: <MessageCircle className={iconClasses} />,
  },
  {
    label: 'common:settingsTabLabel',
    collapsible: false,
    children: [
      {
        label: 'common:routes.settings',
        path: createPath(pathsConfig.app.accountSettings, account),
        Icon: <Settings className={iconClasses} />,
      },
      {
        label: 'common:routes.members',
        path: createPath(pathsConfig.app.accountMembers, account),
        Icon: <Users className={iconClasses} />,
      },
      featureFlagsConfig.enableTeamAccountBilling
        ? {
            label: 'common:routes.billing',
            path: createPath(pathsConfig.app.accountBilling, account),
            Icon: <CreditCard className={iconClasses} />,
          }
        : undefined,
    ].filter(Boolean),
  },
];

export function getTeamAccountSidebarConfig(account: string) {
  return NavigationConfigSchema.parse({
    routes: getRoutes(account),
    style: process.env.NEXT_PUBLIC_TEAM_NAVIGATION_STYLE,
  });
}

function createPath(path: string, account: string) {
  return path.replace('[account]', account);
}
