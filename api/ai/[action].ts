import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAiApiHandler } from '../../src/features/ai-api/utils/logger.js';
import type { AiAuthContext } from '../../src/features/ai-api/utils/auth.js';

import { getBalance } from '../../src/features/ai-api/services/balance.service.js';
import { getMeals } from '../../src/features/ai-api/services/meal.service.js';
import { getDeposits } from '../../src/features/ai-api/services/deposit.service.js';
import { getExpenses } from '../../src/features/ai-api/services/expense.service.js';
import { getCurrentBill } from '../../src/features/ai-api/services/bill.service.js';
import { getMembersSummary } from '../../src/features/ai-api/services/member.service.js';
import { getContext } from '../../src/features/ai-api/services/context.service.js';
import { getRecentTransactions } from '../../src/features/ai-api/services/recent-transactions.service.js';
import { getPaymentHistory } from '../../src/features/ai-api/services/payment-history.service.js';
import { getMonthSummary } from '../../src/features/ai-api/services/month-summary.service.js';
import { getMealRate } from '../../src/features/ai-api/services/meal.service.js';
import { getProfile } from '../../src/features/ai-api/services/profile.service.js';
import { getNotifications } from '../../src/features/ai-api/services/notification.service.js';

async function actionHandler(req: VercelRequest, res: VercelResponse, context: AiAuthContext) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action } = req.query;

  switch (action) {
    case 'balance':
      return res.status(200).json(await getBalance(context));
    case 'meals':
      return res.status(200).json(await getMeals(context));
    case 'deposits':
      return res.status(200).json(await getDeposits(context));
    case 'expenses':
      return res.status(200).json(await getExpenses(context));
    case 'bills':
      return res.status(200).json(await getCurrentBill(context));
    case 'members':
      return res.status(200).json(await getMembersSummary(context));
    case 'context':
      return res.status(200).json(await getContext(context));
    case 'recent-transactions':
      return res.status(200).json(await getRecentTransactions(context));
    case 'payment-history':
      return res.status(200).json(await getPaymentHistory(context));
    case 'month-summary':
      return res.status(200).json(await getMonthSummary(context));
    case 'meal-rate':
      return res.status(200).json(await getMealRate(context));
    case 'profile':
      return res.status(200).json(await getProfile(context));
    case 'notifications':
      return res.status(200).json(await getNotifications(context));
    default:
      return res.status(404).json({ error: `Unknown action: ${action}` });
  }
}

export default withAiApiHandler(actionHandler);
