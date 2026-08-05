import { withAiApiHandler } from '../../src/features/ai-api/utils/logger.js';
import { getBalance } from '../../src/features/ai-api/services/balance.service.js';

export default withAiApiHandler('getBalance', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getBalance(context);
});
