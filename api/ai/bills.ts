import { withAiApiHandler } from '../../src/features/ai-api/utils/logger';
import { getCurrentBill } from '../../src/features/ai-api/services/bill.service';

export default withAiApiHandler('getCurrentBill', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getCurrentBill(context);
});
