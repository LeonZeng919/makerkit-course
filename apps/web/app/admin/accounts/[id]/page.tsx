import { cache } from 'react';

import { AdminAccountPage } from '@kit/admin/components/admin-account-page';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { PageBody } from '@kit/ui/page';

interface Params {
  params: {
    id: string;
  };
}

export const generateMetadata = async ({ params }: Params) => {
  const account = await loadAccount(params.id);

  return {
    title: `Admin | ${account.name}`,
  };
};

async function AccountPage({ params }: Params) {
  const account = await loadAccount(params.id);

  return (
    <PageBody className={'py-4'}>
      <AdminAccountPage account={account} />
    </PageBody>
  );
}

export default AdminGuard(AccountPage);

const loadAccount = cache(accountLoader);

async function accountLoader(id: string) {
  const client = getSupabaseServerAdminClient();

  const { data, error } = await client
    .from('accounts')
    .select('*, memberships: accounts_memberships (*)')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
