import { withAiApiHandler } from '../../src/features/ai-api/utils/logger.js';
import { getExpensesSummary } from '../../src/features/ai-api/services/expense.service.js';

export default withAiApiHandler('getExpensesSummary', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getExpensesSummary(context);
});
