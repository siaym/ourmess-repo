import { aiSupabase } from '../utils/auth.js';
import type { AiAuthContext } from '../utils/auth.js';
import type { MealRateDTO, MealsSummaryDTO, MealRecordDTO } from '../dtos/index.js';
import { aiCache } from '../utils/cache.js';

export async function getMealRate(context: AiAuthContext): Promise<MealRateDTO> {
  const cacheKey = `mealRate_${context.messId}`;
  const cached = aiCache.get<MealRateDTO>(cacheKey);
  if (cached) return cached;

  // We fetch total expenses and total meals to calculate current rate
  // This is a simplification based on typical meal rate logic.
  // We can query member_balances to get the current_meal_rate easily.
  const { data, error } = await aiSupabase
    .from('member_balances')
    .select('current_meal_rate')
    .eq('mess_id', context.messId)
    .limit(1)
    .single();

  if (error) {
    throw new Error('Could not calculate meal rate: ' + error.message);
  }

  const result: MealRateDTO = {
    currentMealRate: data?.current_meal_rate || 0,
    currency: 'BDT',
    lastUpdated: new Date().toISOString(),
  };

  aiCache.set(cacheKey, result, 300); // cache for 5 minutes
  return result;
}

export async function getMealsSummary(context: AiAuthContext): Promise<MealsSummaryDTO> {
  const date = new Date();
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const today = date.toISOString().split('T')[0];

  const { data, error } = await aiSupabase
    .from('meals')
    .select('date, breakfast, lunch, dinner, total_meal')
    .eq('mess_id', context.messId)
    .eq('member_id', context.userId)
    .eq('is_deleted', false)
    .gte('date', startOfMonth)
    .order('date', { ascending: false });

  if (error) {
    throw new Error('Could not fetch meals: ' + error.message);
  }

  let todayMeals: MealRecordDTO | null = null;
  let monthlyTotal = 0;
  const history: MealRecordDTO[] = [];

  for (const row of data || []) {
    const mealRecord: MealRecordDTO = {
      date: row.date,
      breakfast: row.breakfast,
      lunch: row.lunch,
      dinner: row.dinner,
      total: row.total_meal,
    };
    
    if (row.date === today) {
      todayMeals = mealRecord;
    }
    monthlyTotal += row.total_meal;
    history.push(mealRecord);
  }

  return {
    todayMeals,
    monthlyTotalMeals: monthlyTotal,
    history,
  };
}
