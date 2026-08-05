import { aiSupabase } from '../utils/auth.js';
import type { AiAuthContext } from '../utils/auth.js';
import type { BalanceDTO } from '../dtos.js';

export async function getBalance(context: AiAuthContext): Promise<BalanceDTO> {
  // Using the member_balances view that already exists in the project
  const { data, error } = await aiSupabase
    .from('member_balances')
    .select('balance')
    .eq('mess_id', context.messId)
    .eq('member_id', context.userId)
    .single();

  if (error || !data) {
    throw new Error('Could not retrieve balance: ' + (error?.message || 'Not found'));
  }

  return {
    currentBalance: data.balance,
    currency: 'BDT', // Assuming BDT as default for this context
    lastUpdated: new Date().toISOString(),
  };
}
