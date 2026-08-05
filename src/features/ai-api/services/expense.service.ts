import { aiSupabase } from '../utils/auth';
import type { AiAuthContext } from '../utils/auth';
import type { ExpensesSummaryDTO, ExpenseRecordDTO } from '../dtos';

export async function getExpensesSummary(context: AiAuthContext): Promise<ExpensesSummaryDTO> {
  const date = new Date();
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

  // Expenses are typically mess-wide, not user-specific, 
  // but any active member can view the mess expenses summary.
  const { data, error } = await aiSupabase
    .from('expenses')
    .select('title, amount, category, expense_date')
    .eq('mess_id', context.messId)
    .eq('is_deleted', false)
    .gte('expense_date', startOfMonth)
    .order('expense_date', { ascending: false });

  if (error) {
    throw new Error('Could not fetch expenses: ' + error.message);
  }

  let monthlyTotal = 0;
  const history: ExpenseRecordDTO[] = [];

  for (const row of data || []) {
    monthlyTotal += row.amount;
    history.push({
      title: row.title,
      amount: row.amount,
      category: row.category,
      date: row.expense_date,
    });
  }

  return {
    monthlyTotal,
    currency: 'BDT',
    history,
  };
}
