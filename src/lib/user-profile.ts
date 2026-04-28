import type { SupabaseClient, User } from '@supabase/supabase-js';

type ProfileSyncOptions = {
  markVerified?: boolean;
  touchLastLogin?: boolean;
};

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User,
  options: ProfileSyncOptions = {}
) {
  const now = new Date().toISOString();
  const baseProfile = {
    email: user.email ?? '',
    name:
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'User',
    avatar_url: user.user_metadata?.avatar_url ?? null,
    is_active: true,
    is_verified: options.markVerified ?? Boolean(user.email_confirmed_at),
    updated_at: now,
  };

  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingUserError) {
    throw existingUserError;
  }

  if (!existingUser) {
    const insertPayload = {
      id: user.id,
      role: 'user',
      created_at: now,
      ...baseProfile,
      ...(options.touchLastLogin ? { last_login: now } : {}),
    };

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert(insertPayload)
      .select('*')
      .single();

    if (createError) {
      throw createError;
    }

    return createdUser;
  }

  const updatePayload = {
    ...baseProfile,
    ...(options.touchLastLogin ? { last_login: now } : {}),
  };

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', user.id)
    .select('*')
    .single();

  if (updateError) {
    throw updateError;
  }

  return updatedUser;
}
