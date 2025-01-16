import { supabase } from './supabase';

interface EmailTemplate {
  subject: string;
  body: string;
}

export async function triggerEmailProcessing(): Promise<void> {
  // Call the database function to trigger email processing
  const { error } = await supabase.rpc('manual_trigger_email_queue');
  if (error) throw error;
}

export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:product_id (name)
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;
  if (!order) throw new Error('Order not found');

  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('email_settings')
    .single();

  if (settingsError) throw settingsError;
  if (!settings?.email_settings) throw new Error('Email settings not found');

  const template: EmailTemplate = {
    subject: settings.email_settings.order_confirmation_subject,
    body: settings.email_settings.order_confirmation_template
  };

  // The actual email sending is handled by the database trigger
  // This function is just a helper in case we need to resend an email
  await supabase
    .from('email_queue')
    .insert({
      to_email: order.customer_email,
      to_name: order.customer_name,
      subject: template.subject,
      body: template.body,
      metadata: {
        order_id: order.id,
        type: 'order_confirmation'
      }
    });
}

export async function sendRegistrationEmail(userId: string): Promise<void> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) throw userError;
  if (!user) throw new Error('User not found');

  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('email_settings')
    .single();

  if (settingsError) throw settingsError;
  if (!settings?.email_settings) throw new Error('Email settings not found');

  const template: EmailTemplate = {
    subject: settings.email_settings.registration_subject,
    body: settings.email_settings.registration_template
  };

  // The actual email sending is handled by the database trigger
  // This function is just a helper in case we need to resend an email
  await supabase
    .from('email_queue')
    .insert({
      to_email: user.email,
      to_name: `${user.first_name} ${user.last_name}`,
      subject: template.subject,
      body: template.body,
      metadata: {
        user_id: user.id,
        type: 'registration_confirmation'
      }
    });
}