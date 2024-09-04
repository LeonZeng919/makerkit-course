import loadDynamic from 'next/dynamic';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from './_components/team-account-layout-page-header';

interface Params {
  account: string;
}

const DashboardDemo = loadDynamic(
  () => import('./_components/dashboard-demo'),
  {
    ssr: false,
    loading: () => (
      <LoadingOverlay>
        <span className={'text-muted-foreground'}>
          <Trans i18nKey={'common:loading'} />
        </span>
      </LoadingOverlay>
    ),
  },
);

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
  };
};

function TeamAccountHomePage({ params }: { params: Params }) {
  return (
    <>
      <TeamAccountLayoutPageHeader
        account={params.account}
        title={<Trans i18nKey={'common:routes.dashboard'} />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <DashboardDemo />
      </PageBody>
    </>
  );
}

export default withI18n(TeamAccountHomePage);
