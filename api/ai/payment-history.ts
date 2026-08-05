import { withAiApiHandler } from '../../src/features/ai-api/utils/logger.js';
import { getPaymentHistory } from '../../src/features/ai-api/services/payment-history.service.js';

export default withAiApiHandler('getPaymentHistory', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getPaymentHistory(context);
});
