import { supabase } from './supabaseClient';

// Check if user has 2FA enabled
export const check2FAStatus = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('two_factor_enabled')
    .eq('id', userId)
    .single();
  
  return data?.two_factor_enabled || false;
};

// Re-authenticate user before 2FA setup
export const reauthenticateUser = async (password) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password
  });
  
  if (error) throw error;
  return data;
};

// Enable 2FA for user (after re-authentication)
export const enable2FA = async () => {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  });
  
  if (error) throw error;
  return data;
};

// Verify 2FA setup
export const verify2FASetup = async (factorId, code) => {
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factorId,
    code: code
  });
  
  if (error) throw error;
  
  // Update profile to mark 2FA as enabled
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ two_factor_enabled: true })
    .eq('id', data.user.id);
  
  if (updateError) throw updateError;
  return true;
};