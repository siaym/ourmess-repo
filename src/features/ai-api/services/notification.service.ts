import type { AiAuthContext } from '../utils/auth.js';
import type { NotificationDTO } from '../dtos/index.js';

export async function getNotifications(context: AiAuthContext): Promise<NotificationDTO[]> {
  // As per the provided schema, there is no explicit `notifications` table.
  // We will return an empty array for now. If a table is added later, this can be expanded.
  return [];
}
