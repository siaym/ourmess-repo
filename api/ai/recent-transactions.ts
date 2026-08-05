import { withAiApiHandler } from '../../src/features/ai-api/utils/logger.js';
import { getRecentTransactions } from '../../src/features/ai-api/services/recent-transactions.service.js';

export default withAiApiHandler('getRecentTransactions', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getRecentTransactions(context);
});
