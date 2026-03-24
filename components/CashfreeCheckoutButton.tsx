"use client";

import { useState } from "react";
import Script from "next/script";

interface CashfreeCheckoutButtonProps {
  amount: number;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  className?: string;
}

export function CashfreeCheckoutButton({
  amount,
  customerId,
  customerPhone,
  customerEmail,
  customerName,
  className = "",
}: CashfreeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      // 1. Create order on the backend
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          customer_id: customerId,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          customer_name: customerName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.payment_session_id) {
        throw new Error(data.error || "Failed to create payment session");
      }

      // 2. Initialize Cashfree SDK and redirect/open modal
      // @ts-expect-error Cashfree is injected via script tag
      const cashfree = window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === "SANDBOX" ? "sandbox" : "production",
      });

      let checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then((result: any) => {
        if (result.error) {
          console.error("User closed the popup or there was some payment error", result.error);
        }
        if (result.redirect) {
          // Redirecting
        }
        if (result.paymentDetails) {
          console.log("Payment completed successfully!");
          // Optional: Verify payment on your backend or refresh UI
        }
      });
    } catch (error) {
      console.error("Payment initiation failed:", error);
      alert("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors ${className}`}
      >
        {loading ? "Processing..." : `Pay ₹${amount}`}
      </button>
    </>
  );
}
