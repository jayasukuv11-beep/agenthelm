import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM || 'AgentHelm <notifications@agentdock.online>';

/**
 * Send a premium Welcome email to new signups.
 */
export async function sendWelcomeEmail(email: string, fullName?: string) {
  try {
    const name = fullName || 'there';
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Welcome to AgentHelm - Your AI Control Plane is Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #000; border-bottom: 2px solid #eee; padding-bottom: 10px;">Welcome to AgentHelm, ${name}! 🚀</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            We're thrilled to have you on board. AgentHelm is designed to give you professional-grade 
            observability and safety for your AI agents.
          </p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; font-size: 18px;">Quick Start:</h2>
            <ul style="padding-left: 20px;">
              <li><strong>Install the SDK:</strong> <code>pip install agenthelm</code></li>
              <li><strong>Verify your Key:</strong> Log in to your dashboard to get your connect key.</li>
              <li><strong>Connect Telegram:</strong> Use the <code>/start</code> command to get live alerts.</li>
            </ul>
          </div>
          <p>If you have any questions, just reply to this email. We're here to help you scale your agent operations.</p>
          <p style="margin-top: 30px; font-size: 14px; color: #888;">
            Best regards,<br/>
            The AgentHelm Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error (Welcome):', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected Email Error (Welcome):', err);
    return { success: false, error: err };
  }
}

/**
 * Send a confirmation email for the Indie subscription.
 */
export async function sendIndieSubscriptionEmail(email: string, fullName?: string) {
  try {
    const name = fullName || 'there';
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Subscription Confirmed: AgentHelm Indie Plan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #000; border-bottom: 2px solid #eee; padding-bottom: 10px;">You're Now an Indie Pro! 💎</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Excellent choice, ${name}. Your subscription to the AgentHelm **Indie Plan** has been successfully activated.
          </p>
          <div style="background-color: #eefbff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0070f3;">
            <p style="margin: 0; font-weight: bold; color: #0070f3;">What's unlocked:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Higher token limits for your agents</li>
              <li>Priority support and telemetry</li>
              <li>Full Fail-Closed safety monitoring</li>
              <li>Custom alert thresholds</li>
            </ul>
          </div>
          <p>Your limits have been automatically updated in the dashboard. Start deploying those agents!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://agenthelm.vercel.app'}/dashboard" 
             style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Go to Dashboard
          </a>
          <p style="margin-top: 30px; font-size: 14px; color: #888;">
            Thank you for supporting AgentHelm.<br/>
            The AgentHelm Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error (Subscription):', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected Email Error (Subscription):', err);
    return { success: false, error: err };
  }
}
