import { CashfreeCheckoutButton } from "@/components/CashfreeCheckoutButton";

export default function TestPaymentPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800">
        <div>
          <h2 className="text-3xl font-bold text-center mb-2">Checkout</h2>
          <p className="text-center text-gray-500 dark:text-zinc-400">
            Test your Cashfree integration
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">Order Amount</span>
              <span className="text-lg font-bold">₹100.00</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">Sample Customer</span>
              <span className="text-sm">John Doe</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">Phone</span>
              <span className="text-sm">9999999999</span>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <CashfreeCheckoutButton
              amount={100}
              customerId="test_customer_123"
              customerPhone="9999999999"
              customerEmail="test@example.com"
              customerName="John Doe"
              className="w-full py-3 text-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
