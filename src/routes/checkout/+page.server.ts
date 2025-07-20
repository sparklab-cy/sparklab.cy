import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals;
  
  if (!user) {
    return {
      redirect: '/login?redirect=/checkout'
    };
  }
  
  return {
    user
  };
};

export const actions: Actions = {
  processPayment: async ({ request, locals }) => {
    const { user, supabase } = locals;
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    try {
      const formData = await request.formData();
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const email = formData.get('email') as string;
      const paymentMethod = formData.get('paymentMethod') as string;
      const cardNumber = formData.get('cardNumber') as string;
      const expiry = formData.get('expiry') as string;
      const cvv = formData.get('cvv') as string;
      const address = formData.get('address') as string;
      const city = formData.get('city') as string;
      const state = formData.get('state') as string;
      const zipCode = formData.get('zipCode') as string;
      
      // TODO: Integrate with actual payment processor (Stripe, PayPal, etc.)
      // For now, we'll simulate a successful payment
      
      // Create order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'completed',
          total_amount: 0, // Will be calculated from cart items
          payment_method: paymentMethod,
          billing_address: {
            firstName,
            lastName,
            email,
            address,
            city,
            state,
            zipCode
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Failed to create order:', orderError);
        return {
          success: false,
          error: 'Failed to create order'
        };
      }
      
      // TODO: Add order items from cart
      // TODO: Update user's kit access
      // TODO: Send confirmation email
      
      return {
        success: true,
        orderId: order.id
      };
      
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed'
      };
    }
  }
}; 