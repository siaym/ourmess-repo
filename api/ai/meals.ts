import { withAiApiHandler } from '../../src/features/ai-api/utils/logger.js';
import { getMealsSummary } from '../../src/features/ai-api/services/meal.service.js';

export default withAiApiHandler('getMealsSummary', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getMealsSummary(context);
});
