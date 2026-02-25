import type { PageServerLoad, Actions } from './$types';
import { EmailService } from '$lib/services/emailService';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, supabase } = locals;
  
  try {
    // Load all kits
    const { data: kits, error: kitsError } = await supabase
      .from('kits')
      .select('*')
      .order('level', { ascending: true });
    
    if (kitsError) throw kitsError;



    // Load user's purchased kits if logged in
    let userKits: string[] = [];
    if (user) {
      const { data: userPermissions } = await supabase
        .from('user_permissions')
        .select('kit_id, permission_type, expires_at')
        .eq('user_id', user.id)
        .eq('permission_type', 'course_access');
      
      userKits = (userPermissions || []).map(p => p.kit_id);
    }

    return {
      kits: kits || [],
      userKits,
      error: null
    };

  } catch (error) {
    console.error('Failed to load shop data:', error);
    return {
      kits: [],
      userKits: [],
      error: 'Failed to load shop data'
    };
  }
};

export const actions: Actions = {
  purchaseKit: async ({ request, locals }) => {
    const { user, supabase } = locals;
    
    if (!user) {
      return { success: false, error: 'Please log in to purchase kits' };
    }

    try {
      const formData = await request.formData();
      const kitId = formData.get('kitId') as string;
      
      if (!kitId) {
        return { success: false, error: 'Kit ID is required' };
      }

      // Grant permission to the user for this kit
      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: user.id,
          kit_id: kitId,
          permission_type: 'course_access',
          expires_at: null // No expiration for now
        });

      if (error) {
        console.error('Failed to grant kit permission:', error);
        return { success: false, error: 'Failed to purchase kit' };
      }

      // Record the purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          kit_id: kitId,
          amount: 0, // Free via admin purchase
          currency: 'USD',
          payment_method: 'admin_grant',
          payment_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('Failed to record purchase:', purchaseError);
        // Don't fail the purchase if recording fails
      }

      // Send email confirmation
      if (purchase) {
        const { data: kit } = await supabase
          .from('kits')
          .select('*')
          .eq('id', kitId)
          .single();

        if (kit) {
          const emailService = new EmailService(supabase);
          await emailService.sendPurchaseConfirmation(
            purchase,
            kit,
            user.email || '',
            user.user_metadata?.full_name || user.email || 'User'
          );
        }
      }

      return { success: true, message: 'Kit purchased successfully!' };
    } catch (error) {
      console.error('Purchase error:', error);
      return { success: false, error: 'Failed to process purchase' };
    }
  }
}; 