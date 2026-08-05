import { withAiApiHandler } from '../../src/features/ai-api/utils/logger';
import { getPaymentHistory } from '../../src/features/ai-api/services/payment-history.service';

export default withAiApiHandler('getPaymentHistory', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getPaymentHistory(context);
});
