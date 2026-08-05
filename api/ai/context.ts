import { withAiApiHandler } from '../../src/features/ai-api/utils/logger';
import { getContext } from '../../src/features/ai-api/services/context.service';

export default withAiApiHandler('getContext', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getContext(context);
});
