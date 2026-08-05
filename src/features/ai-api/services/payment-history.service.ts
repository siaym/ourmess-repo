import { aiSupabase } from '../utils/auth.js';
import type { AiAuthContext } from '../utils/auth.js';
import type { PaymentHistoryDTO } from '../dtos/index.js';

export async function getPaymentHistory(context: AiAuthContext): Promise<PaymentHistoryDTO> {
  const { data, error } = await aiSupabase
    .from('deposits')
    .select('amount, payment_method, deposit_date')
    .eq('mess_id', context.messId)
    .eq('member_id', context.userId)
    .eq('is_deleted', false)
    .order('deposit_date', { ascending: false });

  if (error) {
    throw new Error('Could not fetch payment history: ' + error.message);
  }

  const history = (data || []).map(row => ({
    amount: row.amount,
    method: row.payment_method,
    date: row.deposit_date,
  }));

  return {
    history,
    currency: 'BDT',
  };
}
