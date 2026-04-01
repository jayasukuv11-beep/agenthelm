import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendIndieSubscriptionEmail } from "@/lib/email";
import { acquireLock } from "@/lib/redis";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!secretKey) {
      console.error("Missing CASHFREE_SECRET_KEY in environment");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    // Verify Signature manually
    const signatureString = timestamp + rawBody;
    const computedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(signatureString)
      .digest("base64");
      
    if (computedSignature !== signature) {
      console.error("Webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log("Cashfree Webhook Received:", payload.type);
    
    // Idempotency check: Cashfree might send the exact same webhook multiple times
    const webhookId = payload.data.order?.order_id || timestamp;
    const lockKey = `webhook_process:${webhookId}:${payload.type}`;
    // We fail-open (true) here so if Redis is down, we don't drop webhooks
    const locked = await acquireLock(lockKey, 86400, true);
    if (!locked) {
      console.log(`[Webhook Idempotency] Skipping duplicate webhook ${lockKey}`);
      return NextResponse.json({ status: "OK", duplicate: true }, { status: 200 });
    }

    switch (payload.type) {
      case "PAYMENT_SUCCESS_WEBHOOK": {
        const orderId = payload.data.order.order_id;
        const paymentAmount = payload.data.payment.payment_amount;
        
        console.log(`✅ Payment confirmed for order: ${orderId} (Amount: ₹${paymentAmount})`);
        
        // 1. Fetch the subscription to get the associated user
        const { data: subData, error: subError } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id, plan')
          .eq('order_id', orderId)
          .single();

        if (subError || !subData) {
          console.error('Subscription not found for order:', orderId, subError);
          break;
        }

        const userId = subData.user_id;

        // 2. Update Subscription status
        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'active', 
            activated_at: new Date().toISOString() 
          })
          .eq('order_id', orderId);

        // 3. Update Profile plan
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ plan: subData.plan })
          .eq('id', userId)
          .select('email, full_name')
          .single();

        if (profileError || !profileData) {
          console.error('Failed to update profile for user:', userId, profileError);
          break;
        }

        // 4. Send Confirmation Email (if plan is indie)
        if (subData.plan === 'indie') {
           console.log(`Sending Indie Confirmation email to: ${profileData.email}`);
           await sendIndieSubscriptionEmail(profileData.email, profileData.full_name);
        }
        
        break;
      }
      
      case "PAYMENT_FAILED_WEBHOOK": {
         const orderId = payload.data.order.order_id;
         console.warn(`❌ Payment failed for order: ${orderId}`);
         await supabaseAdmin
           .from('subscriptions')
           .update({ status: 'failed' })
           .eq('order_id', orderId);
        break;
      }

      default:
        console.log(`Unhandled webhook type: ${payload.type}`);
    }

    return NextResponse.json({ status: "OK" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook unexpected error:", error.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
