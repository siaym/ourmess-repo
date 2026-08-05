import { withAiApiHandler } from '../../src/features/ai-api/utils/logger';
import { getNotifications } from '../../src/features/ai-api/services/notification.service';

export default withAiApiHandler('getNotifications', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getNotifications(context);
});
