import { aiSupabase } from '../utils/auth.js';
import type { AiAuthContext } from '../utils/auth.js';
import type { MembersSummaryDTO, MemberDTO } from '../dtos.js';
import { enforceMinRole } from '../utils/auth.js';

export async function getMembersSummary(context: AiAuthContext): Promise<MembersSummaryDTO> {
  // Enforce permissions: Only managers and owners can see all members' details
  enforceMinRole(context, 'manager');

  const { data, error } = await aiSupabase
    .from('member_balances')
    .select('member_id, current_meal_rate, total_deposits, total_meals, balance, users(name), mess_members(role)')
    .eq('mess_id', context.messId);

  // Since it's a view joining users and mess_members might be tricky or we can query them separately.
  // Assuming the view `member_balances` does NOT include `name` and `role`, we must fetch them.
  // Wait, let's fetch from `mess_members` and join `users` and `member_balances` manually to avoid view limitations.

  const { data: membersData, error: membersError } = await aiSupabase
    .from('mess_members')
    .select(`
      user_id,
      role,
      users ( name )
    `)
    .eq('mess_id', context.messId)
    .eq('is_deleted', false);

  if (membersError) throw new Error('Could not fetch members: ' + membersError.message);

  const { data: balancesData, error: balancesError } = await aiSupabase
    .from('member_balances')
    .select('member_id, balance')
    .eq('mess_id', context.messId);

  if (balancesError) throw new Error('Could not fetch member balances: ' + balancesError.message);

  const members: MemberDTO[] = [];

  for (const member of membersData || []) {
    const user = (member.users as unknown as { name: string }) || { name: 'Unknown' };
    const balanceRecord = balancesData?.find(b => b.member_id === member.user_id);
    const balance = balanceRecord?.balance || 0;

    members.push({
      name: user.name,
      role: member.role,
      balance: balance,
      dues: balance < 0 ? Math.abs(balance) : 0,
      currency: 'BDT',
    });
  }

  return { members };
}
