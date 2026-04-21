import React from "react"
import { LegalPage } from "@/components/legal/LegalPage"

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="March 24, 2026">
      <section>
        <p>
          Welcome to AgentHelm. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you as to how we look after your personal data when you visit our website 
          or use our platform and tell you about your privacy rights and how the law protects you.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">1. Information We Collect</h2>
        <p>
          We collect personal information that you provide to us when you register on our platform, participate in our features, 
          or otherwise contact us.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Personal Identification Information:</strong> Name, email address, phone number.</li>
          <li><strong>Payment Information:</strong> We use <strong>Dodo Payments</strong> as our payment processor for all secure payments. 
          We do not store raw credit card data or payment instrument details on our servers.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide, operate, and maintain our AI Agent platform.</li>
          <li>Process your transactions and send related information, including purchase confirmations and invoices.</li>
          <li>Send you technical notices, updates, security alerts, and support messages.</li>
          <li>Respond to your comments, questions, and customer service requests.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">3. Data Processing and AI</h2>
        <p>
          As an AI Agent platform, data submitted to our agents may be processed by AI models. 
          We take appropriate measures to ensure the security and privacy of this data.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">4. Third-Party Services</h2>
        <p>
          We may share your information with third-party vendors, service providers, contractors, or agents who perform 
          services for us or on our behalf and require access to such information to do that work. 
          This includes our payment processor, Dodo Payments.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">5. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us:</p>
        <p className="font-mono text-orange-400">tharagesharumugam@gmail.com</p>
      </section>
    </LegalPage>
  )
}
