import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import {
	isShopifyConfigured,
	fetchShopifyVariantMapForKits,
	type ShopifyVariantInfo
} from '$lib/server/shopifyStorefront';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { kitId } = params;
  const { user, supabase } = locals;
  const shopifyEnabled = isShopifyConfigured();

  try {
    // Load the specific kit
    const { data: kit, error: kitError } = await supabase
      .from('kits')
      .select('*')
      .eq('id', kitId)
      .single();

    if (kitError || !kit) {
      throw error(404, 'Kit not found');
    }

    let variantMap = new Map<string, ShopifyVariantInfo>();
    if (shopifyEnabled) {
      try {
        variantMap = await fetchShopifyVariantMapForKits([kitId]);
      } catch (e) {
        console.error('Shopify variant map:', e);
      }
    }
    const v = variantMap.get(kitId);
    const kitMerged = {
      ...kit,
      shopifyVariantGid: v?.variantGid ?? null,
      displayPrice: v ? v.priceAmount : Number(kit.price),
      currencyCode: v?.currencyCode ?? 'USD'
    };

    // Load official courses for this kit
    const { data: officialCourses, error: coursesError } = await supabase
      .from('official_courses')
      .select('*')
      .eq('kit_id', kitId)
      .eq('is_published', true)
      .order('level', { ascending: true });

    if (coursesError) throw coursesError;

    // Load community courses for this kit
    const { data: communityCourses, error: communityError } = await supabase
      .from('custom_courses')
      .select('*')
      .eq('kit_id', kitId)
      .eq('is_published', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (communityError) throw communityError;

    // Check if user has access to this kit
    let hasAccess = false;
    if (user) {
      const { data: userPermission } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('kit_id', kitId)
        .eq('permission_type', 'course_access')
        .single();

      hasAccess = !!userPermission;
    }

    return {
      kit: kitMerged,
      shopifyEnabled,
      officialCourses: officialCourses || [],
      communityCourses: communityCourses || [],
      hasAccess,
      error: null
    };

  } catch (err) {
    console.error('Failed to load kit:', err);
    throw error(500, 'Failed to load kit details');
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
      const quantity = parseInt(formData.get('quantity') as string) || 1;
      
      if (!kitId) {
        return { success: false, error: 'Kit ID is required' };
      }

      if (isShopifyConfigured()) {
        const map = await fetchShopifyVariantMapForKits([kitId]);
        if (map.has(kitId)) {
          return {
            success: false,
            error: 'Use the shop cart and Shopify checkout for this kit.'
          };
        }
      }

      // Get kit details for pricing
      const { data: kit, error: kitError } = await supabase
        .from('kits')
        .select('*')
        .eq('id', kitId)
        .single();

      if (kitError || !kit) {
        return { success: false, error: 'Kit not found' };
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
          amount: kit.price * quantity,
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

      return { success: true, message: `Kit purchased successfully! Total: $${(kit.price * quantity).toFixed(2)}` };
    } catch (error) {
      console.error('Purchase error:', error);
      return { success: false, error: 'Failed to process purchase' };
    }
  }
}; 