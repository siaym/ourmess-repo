import { withAiApiHandler } from '../../src/features/ai-api/utils/logger';
import { getProfile } from '../../src/features/ai-api/services/profile.service';

export default withAiApiHandler('getProfile', async (req, res, context) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return await getProfile(context);
});
