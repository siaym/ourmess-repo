import { withAiApiHandler } from '../../src/features/ai-api/utils/logger';
import { getExpensesSummary } from '../../src/features/ai-api/services/expense.service';

export default withAiApiHandler('getExpensesSummary', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getExpensesSummary(context);
});
