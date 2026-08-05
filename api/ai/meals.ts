import { withAiApiHandler } from '../../src/features/ai-api/utils/logger';
import { getMealsSummary } from '../../src/features/ai-api/services/meal.service';

export default withAiApiHandler('getMealsSummary', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getMealsSummary(context);
});
