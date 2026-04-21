import React from "react"
import { LegalPage } from "@/components/legal/LegalPage"

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" lastUpdated="March 24, 2026">
      <section>
        <p>
          Thank you for choosing AgentHelm. We strive to provide the best AI Agent platform experience possible.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">7-Day Refund Window</h2>
        <p>
          We offer a <strong>7-day refund window</strong> specifically for <strong>technical issues</strong> that 
          prevent you from using our platform as intended.
        </p>
        <p className="mt-4">
          If you encounter a significant technical problem that our support team is unable to resolve within 7 days of your 
          initial purchase or subscription renewal, you may be eligible for a refund.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Conditions for Refund</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>The refund request must be submitted within 7 days of the transaction date.</li>
          <li>The issue must be a verifiable technical problem with the AgentHelm platform.</li>
          <li>You must provide reasonable cooperation with our support team to troubleshoot and resolve the issue before a refund is issued.</li>
          <li>Refunds are not granted for changes of mind, lack of use, or user errors.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Payment Processor</h2>
        <p>
          All approved refunds will be processed securely through our payment provider, <strong>Dodo Payments</strong>. 
          Please note that it may take several business days for the refund to reflect in your account, 
          depending on your bank or card issuer.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">How to Request a Refund</h2>
        <p>
          To request a refund due to a technical issue, please contact our support team with a detailed description 
          of the problem and your account details:
        </p>
        <p className="font-mono text-orange-400 mt-4">tharagesharumugam@gmail.com</p>
      </section>
    </LegalPage>
  )
}
