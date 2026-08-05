import type { AiAuthContext } from '../utils/auth';
import type { ContextDTO } from '../dtos';
import { getProfile } from './profile.service';
import { getBalance } from './balance.service';
import { getMealRate } from './meal.service';
import { getDepositsSummary } from './deposit.service';
import { getExpensesSummary } from './expense.service';
import { getNotifications } from './notification.service';

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
