import { withAiApiHandler } from '../../src/features/ai-api/utils/logger.js';
import { getMembersSummary } from '../../src/features/ai-api/services/member.service.js';

export default withAiApiHandler('getMembersSummary', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getMembersSummary(context);
});
