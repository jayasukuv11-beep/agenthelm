import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client to verify the request if needed
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Basic security check
    const secret = req.headers.get('x-webhook-secret')?.trim();
    const expectedSecret = process.env.SETUP_SECRET?.trim();
    
    console.log('Webhook Debug - Received Secret:', secret ? 'EXISTS' : 'MISSING');
    
    if (secret !== expectedSecret && process.env.NODE_ENV === 'production') {
       console.error('Unauthorized Signup Webhook Access. Expected secret exists:', !!expectedSecret);
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    console.log('Signup Webhook Payload Structure:', Object.keys(payload));

    // Supabase Webhook payloads for INSERT have the record in 'record'
    const profile = payload.record || payload;
    const { email, full_name } = profile;

    console.log('Webhook Debug - Profile Email:', email);
    console.log('Webhook Debug - Profile Full Name:', full_name);

    if (!email) {
      console.error('Webhook Error - No email found in payload');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`Attempting to send welcome email to: ${email}`);
    const result = await sendWelcomeEmail(email, full_name || '');

    if (!result.success) {
       // Log the error but return 200 so Supabase doesn't retry unnecessarily
       console.error('Failed to send welcome email:', result.error);
    }

    return NextResponse.json({ success: true, email });
  } catch (err: any) {
    console.error('Signup Webhook Error:', err.message);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
