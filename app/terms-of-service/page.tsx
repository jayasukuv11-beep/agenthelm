import React from "react"
import { LegalPage } from "@/components/legal/LegalPage"

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="March 24, 2026">
      <section>
        <p>
          Welcome to AgentHelm, an AI Agent platform. These Terms of Service ("Terms") govern your use of the 
          AgentHelm website, services, and platform (collectively, the "Services"). By accessing or using our Services, 
          you agree to be bound by these Terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
        <p>By accessing and using our Services, you accept and agree to be bound by the terms and provisions of this agreement.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">2. Description of Service</h2>
        <p>
          AgentHelm provides a platform for managing, creating, and deploying AI Agents. 
          We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) 
          with or without notice.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">3. Account Registration</h2>
        <p>
          To access certain features of the platform, you must register for an account. 
          You agree to provide accurate, current, and complete information and to keep your account information updated.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">4. Payments and Subscriptions</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>All payments for our Services are securely processed via <strong>Cashfree</strong>.</li>
          <li><strong>We do not store raw credit card data on our servers.</strong></li>
          <li>By submitting payment details, you authorize our third-party payment processor to charge the applicable fees to your payment method.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">5. Refund Policy</h2>
        <p>
          Our refund procedures are governed by our Refund Policy. Please refer to our 
          <a href="/refund-policy" className="text-orange-500 hover:underline mx-1">Refund Policy</a> 
          for detailed information regarding our 7-day refund window for technical issues.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">6. User Conduct</h2>
        <p>
          You agree not to use the Services for any unlawful purpose or in any way that interrupts, damages, or impairs the service. 
          As an AI Agent platform, you are responsible for the actions and outputs directed by your agents.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">7. Contact Information</h2>
        <p>If you have any questions regarding these Terms, please contact us at:</p>
        <p className="font-mono text-orange-400">tharagesharumugam@gmail.com</p>
      </section>
    </LegalPage>
  )
}
