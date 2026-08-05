import { withAiApiHandler } from '../../src/features/ai-api/utils/logger.js';
import { getMonthSummary } from '../../src/features/ai-api/services/month-summary.service.js';

export default withAiApiHandler('getMonthSummary', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getMonthSummary(context);
});
