import { createServerSupabaseClient } from './supabase-server'

export async function getUser() {
  const supabase = createServerSupabaseClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Check if user exists in profiles table, create if not
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code === 'PGRST116') {
    // Profile doesn't exist, create it
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          username: user.email?.split('@')[0] + '-' + user.id.slice(-4),
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      return user
    }

    return { ...user, profile: newProfile }
  }

  return { ...user, profile }
}