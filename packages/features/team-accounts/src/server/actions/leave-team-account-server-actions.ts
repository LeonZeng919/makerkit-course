'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { LeaveTeamAccountSchema } from '../../schema/leave-team-account.schema';
import { createLeaveTeamAccountService } from '../services/leave-team-account.service';

export const leaveTeamAccountAction = enhanceAction(
  async (formData: FormData, user) => {
    const body = Object.fromEntries(formData.entries());
    const params = LeaveTeamAccountSchema.parse(body);

    const service = createLeaveTeamAccountService(
      getSupabaseServerAdminClient(),
    );

    await service.leaveTeamAccount({
      accountId: params.accountId,
      userId: user.id,
    });

    revalidatePath('/home/[account]', 'layout');

    return redirect('/home');
  },
  {},
);
