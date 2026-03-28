import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { EmailService } from '$lib/services/emailService';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals;

  if (!user) {
    throw redirect(302, '/login?redirect=/redeem');
  }

  return {
    user
  };
};

export const actions: Actions = {
  redeemCode: async ({ request, locals }) => {
    const { user, supabase } = locals;
    
    if (!user) {
      return { success: false, error: 'Please log in to redeem codes' };
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return {
        success: false,
        error: 'Code redemption is not available (server configuration). Please contact support.'
      };
    }

    try {
      const formData = await request.formData();
      const code = formData.get('code') as string;
      
      if (!code || code.trim().length === 0) {
        return { success: false, error: 'Please enter a valid code' };
      }
      
      // RLS blocks non-admins from reading unused kit_codes; service role performs a controlled lookup.
      const { data: kitCode, error: codeError } = await admin
        .from('kit_codes')
        .select(`
          *,
          kit:kits(id, name, theme, level, price)
        `)
        .eq('code', code.trim())
        .eq('is_used', false)
        .single();

      if (codeError || !kitCode) {
        return { success: false, error: 'Invalid or expired code' };
      }

      if (kitCode.expires_at && new Date(kitCode.expires_at) < new Date()) {
        return { success: false, error: 'This code has expired' };
      }

      // Check if user already has access to this kit
      const { data: existingPermission } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('kit_id', kitCode.kit_id)
        .eq('permission_type', 'course_access')
        .single();

      if (existingPermission) {
        return { success: false, error: 'You already have access to this kit' };
      }

      // Mark the code as used - RLS allows only admins to update kit_codes
      const { error: updateError, data: updatedCode } = await admin
        .from('kit_codes')
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString()
        })
        .eq('id', kitCode.id)
        .eq('is_used', false)
        .select()
        .single();

      if (updateError || !updatedCode) {
        // Code was already used by another request
        return { success: false, error: 'This code has already been used' };
      }

      // Grant permission — RLS restricts inserts to admins; always grant for the signed-in user only
      const { error: permissionError } = await admin
        .from('user_permissions')
        .upsert({
          user_id: user.id,
          kit_id: kitCode.kit_id,
          permission_type: 'course_access',
          expires_at: null
        });

      if (permissionError) {
        return { success: false, error: 'Failed to grant kit access' };
      }

      // Record the purchase
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          kit_id: kitCode.kit_id,
          amount: 0, // Free via code redemption
          currency: 'USD',
          payment_method: 'code_redemption',
          payment_status: 'completed',
          kit_code_id: kitCode.id,
          completed_at: new Date().toISOString()
        });

      if (purchaseError) {
        console.error('Failed to record purchase:', purchaseError);
        // Don't fail the redemption if purchase recording fails
      }

      // Send email confirmation
      const emailService = new EmailService(supabase);
      await emailService.sendCodeRedemptionConfirmation(
        kitCode.kit,
        user.email || '',
        user.user_metadata?.full_name || user.email || 'User'
      );

      return { 
        success: true, 
        message: `Successfully redeemed ${kitCode.kit.name}! You now have access to all courses for this kit.`,
        kit: kitCode.kit
      };

    } catch (error) {
      console.error('Code redemption error:', error);
      return { success: false, error: 'Failed to process code redemption' };
    }
  }
}; 