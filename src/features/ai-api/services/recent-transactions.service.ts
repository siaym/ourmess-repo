import { aiSupabase } from '../utils/auth';
import type { AiAuthContext } from '../utils/auth';
import type { RecentTransactionsSummaryDTO, RecentTransactionDTO } from '../dtos';

export async function getRecentTransactions(context: AiAuthContext): Promise<RecentTransactionsSummaryDTO> {
  // Fetch deposits for the user
  const { data: deposits, error: depositsError } = await aiSupabase
    .from('deposits')
    .select('id, amount, payment_method, deposit_date')
    .eq('mess_id', context.messId)
    .eq('member_id', context.userId)
    .eq('is_deleted', false)
    .order('deposit_date', { ascending: false })
    .limit(10);

  if (depositsError) {
    throw new Error('Could not fetch deposits: ' + depositsError.message);
  }

  // Fetch expenses for the mess
  const { data: expenses, error: expensesError } = await aiSupabase
    .from('expenses')
    .select('id, title, amount, expense_date')
    .eq('mess_id', context.messId)
    .eq('is_deleted', false)
    .order('expense_date', { ascending: false })
    .limit(10);

  if (expensesError) {
    throw new Error('Could not fetch expenses: ' + expensesError.message);
  }

  const transactions: RecentTransactionDTO[] = [];

  for (const dep of deposits || []) {
    transactions.push({
      id: dep.id,
      type: 'deposit',
      title: `Deposit via ${dep.payment_method}`,
      amount: dep.amount,
      date: dep.deposit_date,
      currency: 'BDT'
    });
  }

  for (const exp of expenses || []) {
    transactions.push({
      id: exp.id,
      type: 'expense',
      title: exp.title,
      amount: exp.amount,
      date: exp.expense_date,
      currency: 'BDT'
    });
  }

  // Sort combined by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    transactions: transactions.slice(0, 10), // Top 10 overall
  };
}
