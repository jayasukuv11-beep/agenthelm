import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

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

    // Verify Signature manually to ensure compatibility with Next.js Request streams
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
    
    // Check webhook event type
    switch (payload.type) {
      case "PAYMENT_SUCCESS_WEBHOOK": {
        const orderId = payload.data.order.order_id;
        const paymentAmount = payload.data.payment.payment_amount;
        
        console.log(`✅ Payment confirmed for order: ${orderId} (Amount: ₹${paymentAmount})`);
        
        // TODO: Update your database using the orderId. Example:
        // await db.updateOrder(orderId, { status: "PAID" });
        
        break;
      }
      
      case "PAYMENT_FAILED_WEBHOOK": {
         const orderId = payload.data.order.order_id;
         console.warn(`❌ Payment failed for order: ${orderId}`);
         // TODO: Mark order as failed in database
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
