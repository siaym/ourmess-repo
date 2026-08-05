import type { AiAuthContext } from '../utils/auth';
import type { ProfileDTO } from '../dtos';

export async function getProfile(context: AiAuthContext): Promise<ProfileDTO> {
  // Assuming mess name is not strictly required to be queried again if we just want basic info,
  // but to fulfill the DTO, we should fetch mess name.
  
  // To keep it clean, we'll import aiSupabase and fetch it
  const { aiSupabase } = await import('../utils/auth');

  const { data, error } = await aiSupabase
    .from('messes')
    .select('name')
    .eq('id', context.messId)
    .single();

  return {
    user: {
      id: context.userId,
      name: context.user.name,
      email: context.user.email,
    },
    mess: {
      id: context.messId,
      name: data?.name || 'Unknown Mess',
    },
    role: context.role,
  };
}
