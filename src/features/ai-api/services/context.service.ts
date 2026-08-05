import type { AiAuthContext } from '../utils/auth.js';
import type { ContextDTO } from '../dtos.js';
import { getProfile } from './profile.service.js';
import { getBalance } from './balance.service.js';
import { getMealRate } from './meal.service.js';
import { getDepositsSummary } from './deposit.service.js';
import { getExpensesSummary } from './expense.service.js';
import { getNotifications } from './notification.service.js';

export async function getContext(context: AiAuthContext): Promise<ContextDTO> {
  // Execute all independent promises concurrently for performance
  const [
    profile,
    balance,
    mealRate,
    depositsSummary,
    expensesSummary,
    notifications
  ] = await Promise.all([
    getProfile(context),
    getBalance(context),
    getMealRate(context),
    getDepositsSummary(context),
    getExpensesSummary(context),
    getNotifications(context),
  ]);

  return {
    member: profile,
    balance,
    mealRate,
    deposits: depositsSummary.history,
    recentExpenses: expensesSummary.history.slice(0, 5), // Return top 5 recent expenses
    notifications,
  };
}
