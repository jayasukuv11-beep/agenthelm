import { NextResponse } from "next/server";
import { Cashfree, CFEnvironment } from "cashfree-pg";

const cashfree = new Cashfree(
  process.env.CASHFREE_ENVIRONMENT === "PRODUCTION"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = "INR",
      customer_id,
      customer_phone,
      customer_email,
      customer_name,
      order_meta,
    } = body;

    if (!amount || !customer_id || !customer_phone) {
      return NextResponse.json(
        { error: "Missing required fields: amount, customer_id, customer_phone" },
        { status: 400 }
      );
    }

    const orderId = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const createOrderRequest = {
      order_amount: amount,
      order_currency: currency,
      order_id: orderId,
      customer_details: {
        customer_id,
        customer_phone,
        customer_email: customer_email || "customer@example.com",
        customer_name: customer_name || "Customer",
      },
      order_meta: order_meta || {
        return_url: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/payment/status?order_id=${orderId}`,
      },
    };

    const response = await cashfree.PGCreateOrder(
      createOrderRequest as any
    );

    // Some versions of the Cashfree SDK return an axios response object with data.
    const responseData = response.data ? response.data : response;

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error(
      "Error creating Cashfree order:",
      error?.response?.data || error.message
    );
    return NextResponse.json(
      {
        error: "Failed to create payment session",
        details: error?.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
