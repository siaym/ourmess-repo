import { aiSupabase } from '../utils/auth.js';
import type { AiAuthContext } from '../utils/auth.js';
import type { MonthSummaryDTO } from '../dtos/index.js';
import { getMealRate } from './meal.service.js';

export async function getMonthSummary(context: AiAuthContext): Promise<MonthSummaryDTO> {
  const date = new Date();
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

  // 1. Get Meal Rate
  const mealRateInfo = await getMealRate(context);

  // 2. Get total meals in mess for the month
  const { data: mealsData, error: mealsError } = await aiSupabase
    .from('meals')
    .select('total_meal')
    .eq('mess_id', context.messId)
    .eq('is_deleted', false)
    .gte('date', startOfMonth);

  if (mealsError) throw new Error('Could not fetch month meals: ' + mealsError.message);
  const totalMeals = mealsData?.reduce((sum, row) => sum + row.total_meal, 0) || 0;

  // 3. Get total expenses for the month
  const { data: expData, error: expError } = await aiSupabase
    .from('expenses')
    .select('amount')
    .eq('mess_id', context.messId)
    .eq('is_deleted', false)
    .gte('expense_date', startOfMonth);

  if (expError) throw new Error('Could not fetch month expenses: ' + expError.message);
  const totalExpenses = expData?.reduce((sum, row) => sum + row.amount, 0) || 0;

  // 4. Get total deposits for the month
  const { data: depData, error: depError } = await aiSupabase
    .from('deposits')
    .select('amount')
    .eq('mess_id', context.messId)
    .eq('is_deleted', false)
    .gte('deposit_date', startOfMonth);

  if (depError) throw new Error('Could not fetch month deposits: ' + depError.message);
  const totalDeposits = depData?.reduce((sum, row) => sum + row.amount, 0) || 0;

  return {
    month: monthName,
    mealRate: mealRateInfo.currentMealRate,
    totalMeals,
    totalExpenses,
    totalDeposits,
    totalBalance: totalDeposits - totalExpenses, // Simplified overall mess balance logic
    currency: 'BDT',
  };
}
