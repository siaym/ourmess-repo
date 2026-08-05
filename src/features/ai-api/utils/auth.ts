import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/database';

// Initialize a supabase admin client or rely on the fact that getUser checks JWT against the server.
// For serverless functions, we should use a fresh client with the request context if possible, 
// but since we are just validating JWT, we can use the regular project url and anon key.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const aiSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export interface AiAuthContext {
  userId: string;
  messId: string;
  role: 'owner' | 'manager' | 'member';
  user: {
    name: string;
    email: string;
  };
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden: Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Extracts and verifies the JWT token from the Authorization header.
 * Ensures the user is part of a mess and returns their context.
 */
export async function getAiAuthContext(authHeader?: string): Promise<AiAuthContext> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await aiSupabase.auth.getUser(token);

  if (error || !user) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  // Get user profile details
  const { data: userProfile, error: userError } = await aiSupabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .single();

  if (userError || !userProfile) {
    throw new UnauthorizedError('User profile not found');
  }

  // Find their active mess_member record
  // Assuming a user can only be in one active mess at a time for this context,
  // or we get the most recently joined active one.
  const { data: memberData, error: memberError } = await aiSupabase
    .from('mess_members')
    .select('mess_id, role')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single();

  if (memberError || !memberData) {
    throw new UnauthorizedError('User is not assigned to any active mess');
  }

  return {
    userId: user.id,
    messId: memberData.mess_id,
    role: memberData.role,
    user: {
      name: userProfile.name,
      email: userProfile.email,
    }
  };
}

/**
 * Validates if the context meets the required minimum role.
 */
export function enforceMinRole(context: AiAuthContext, requiredRole: 'owner' | 'manager' | 'member') {
  const roleWeights = { member: 1, manager: 2, owner: 3 };
  if (roleWeights[context.role] < roleWeights[requiredRole]) {
    throw new ForbiddenError();
  }
}
