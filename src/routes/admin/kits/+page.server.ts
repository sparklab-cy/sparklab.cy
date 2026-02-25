import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, supabase } = locals;
  
  // Check admin permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();
  
  if (!user || profile?.role !== 'admin') {
    throw redirect(302, '/');
  }

  try {
    // Load all kits
    const { data: kits, error: kitsError } = await supabase
      .from('kits')
      .select('*')
      .order('level', { ascending: true });

    if (kitsError) throw kitsError;

    // Load kit codes for each kit
    const { data: kitCodes, error: codesError } = await supabase
      .from('kit_codes')
      .select(`
        *,
        kit:kits(name)
      `)
      .order('created_at', { ascending: false });

    if (codesError) throw codesError;

    // Load purchase statistics
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        *,
        kit:kits(name)
      `)
      .order('created_at', { ascending: false });

    if (purchasesError) throw purchasesError;

    return {
      kits: kits || [],
      kitCodes: kitCodes || [],
      purchases: purchases || [],
      error: null
    };

  } catch (error) {
    console.error('Failed to load admin kit data:', error);
    return {
      kits: [],
      kitCodes: [],
      purchases: [],
      error: 'Failed to load admin kit data'
    };
  }
};

export const actions: Actions = {
  createKit: async ({ request, locals }) => {
    const { user, supabase } = locals;
    
    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (!user || profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const formData = await request.formData();
      const name = formData.get('name') as string;
      const theme = formData.get('theme') as string;
      const level = parseInt(formData.get('level') as string);
      const description = formData.get('description') as string;
      const price = parseFloat(formData.get('price') as string);
      const kitType = formData.get('kit_type') as 'normal' | 'organization';

      const { data: kit, error } = await supabase
        .from('kits')
        .insert({
          name,
          theme,
          level,
          description,
          price,
          kit_type: kitType,
          qr_code: '', // Will be generated
          access_code: '' // Will be generated
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, kitId: kit.id };
    } catch (error) {
      console.error('Failed to create kit:', error);
      return { success: false, error: 'Failed to create kit' };
    }
  },

  generateKitCodes: async ({ request, locals }) => {
    const { user, supabase } = locals;
    
    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (!user || profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const formData = await request.formData();
      const kitId = formData.get('kitId') as string;
      const codeType = formData.get('codeType') as 'qr' | 'access_code';
      const quantity = parseInt(formData.get('quantity') as string);
      const expiresAt = formData.get('expiresAt') as string;

      const codes = [];
      for (let i = 0; i < quantity; i++) {
        const code = generateUniqueCode();
        codes.push({
          kit_id: kitId,
          code,
          code_type: codeType,
          is_used: false,
          expires_at: expiresAt || null
        });
      }

      const { error } = await supabase
        .from('kit_codes')
        .insert(codes);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: `Generated ${quantity} ${codeType} codes` };
    } catch (error) {
      console.error('Failed to generate kit codes:', error);
      return { success: false, error: 'Failed to generate kit codes' };
    }
  },

  deleteKitCode: async ({ request, locals }) => {
    const { user, supabase } = locals;
    
    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (!user || profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const formData = await request.formData();
      const codeId = formData.get('codeId') as string;

      const { error } = await supabase
        .from('kit_codes')
        .delete()
        .eq('id', codeId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Code deleted successfully' };
    } catch (error) {
      console.error('Failed to delete kit code:', error);
      return { success: false, error: 'Failed to delete kit code' };
    }
  },

  grantKitAccess: async ({ request, locals }) => {
    const { user, supabase } = locals;
    
    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (!user || profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const formData = await request.formData();
      const userId = formData.get('userId') as string;
      const kitId = formData.get('kitId') as string;
      const expiresAt = formData.get('expiresAt') as string;

      // Grant permission
      const { error: permissionError } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          kit_id: kitId,
          permission_type: 'course_access',
          expires_at: expiresAt || null
        });

      if (permissionError) {
        return { success: false, error: permissionError.message };
      }

      // Record the admin grant
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          kit_id: kitId,
          amount: 0,
          currency: 'USD',
          payment_method: 'admin_grant',
          payment_status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (purchaseError) {
        console.error('Failed to record admin grant:', purchaseError);
        // Don't fail the grant if purchase recording fails
      }

      return { success: true, message: 'Kit access granted successfully' };
    } catch (error) {
      console.error('Failed to grant kit access:', error);
      return { success: false, error: 'Failed to grant kit access' };
    }
  }
};

// Generate unique code
function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 