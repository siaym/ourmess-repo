import { aiSupabase } from '../utils/auth.js';
import type { AiAuthContext } from '../utils/auth.js';
import type { DepositsSummaryDTO, DepositRecordDTO } from '../dtos/index.js';

export async function getDepositsSummary(context: AiAuthContext): Promise<DepositsSummaryDTO> {
  const { data, error } = await aiSupabase
    .from('deposits')
    .select('amount, payment_method, deposit_date')
    .eq('mess_id', context.messId)
    .eq('member_id', context.userId)
    .eq('is_deleted', false)
    .order('deposit_date', { ascending: false });

  if (error) {
    throw new Error('Could not fetch deposits: ' + error.message);
  }

  let totalDeposits = 0;
  const history: DepositRecordDTO[] = [];

  for (const row of data || []) {
    totalDeposits += row.amount;
    history.push({
      amount: row.amount,
      method: row.payment_method,
      date: row.deposit_date,
    });
  }

  return {
    totalDeposits,
    currency: 'BDT',
    history,
  };
}
