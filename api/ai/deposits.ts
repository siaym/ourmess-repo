import { withAiApiHandler } from '../../src/features/ai-api/utils/logger.js';
import { getDepositsSummary } from '../../src/features/ai-api/services/deposit.service.js';

export default withAiApiHandler('getDepositsSummary', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getDepositsSummary(context);
});
