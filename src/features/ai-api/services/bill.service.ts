import { aiSupabase } from '../utils/auth';
import type { AiAuthContext } from '../utils/auth';
import type { BillDTO } from '../dtos';
import { getBalance } from './balance.service';

export async function getCurrentBill(context: AiAuthContext): Promise<BillDTO> {
  const date = new Date();
  const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Current bill could be interpreted as:
  // (Total meals of user * current meal rate)
  // And Paid = Total deposits of user
  // And Due = if Balance is negative, that's the Due
  
  // Easiest is to pull from member_balances view
  const { data, error } = await aiSupabase
    .from('member_balances')
    .select('total_deposits, total_meals, current_meal_rate, balance')
    .eq('mess_id', context.messId)
    .eq('member_id', context.userId)
    .single();

  if (error || !data) {
    throw new Error('Could not retrieve bill details: ' + (error?.message || 'Not found'));
  }

  const currentBill = data.total_meals * data.current_meal_rate;
  const paid = data.total_deposits;
  const due = data.balance < 0 ? Math.abs(data.balance) : 0;

  return {
    currentBill,
    paid,
    due,
    currency: 'BDT',
    month: monthName,
  };
}
