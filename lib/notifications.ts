/**
 * Multi-Channel Notification Engine for AgentHelm HITL Approvals
 * Supports Telegram, Slack Webhooks, and Discord Webhooks.
 */

export interface InterventionAlertPayload {
  interventionId: string;
  agentName: string;
  actionName: string;
  payload: Record<string, any>;
  confirmType: string;
  baseUrl: string;
}

/**
 * Send interactive approval alert to Slack Incoming Webhook
 */
export async function sendSlackApprovalAlert(
  webhookUrl: string,
  alert: InterventionAlertPayload
): Promise<boolean> {
  if (!webhookUrl) return false;

  const approvalUrl = `${alert.baseUrl}/dashboard/agents?intervention=${alert.interventionId}`;
  
  const slackBody = {
    text: `⚠️ Irreversible Action Requested by ${alert.agentName}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "⚠️ Irreversible Action Requested",
          emoji: false
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Agent:*\n\`${alert.agentName}\``
          },
          {
            type: "mrkdwn",
            text: `*Action:*\n\`${alert.actionName}\``
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Payload:*\n\`\`\`${JSON.stringify(alert.payload, null, 2)}\`\`\``
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Review & Approve in Dashboard",
              emoji: false
            },
            style: "primary",
            url: approvalUrl
          }
        ]
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackBody)
    });
    return res.ok;
  } catch (err) {
    console.error("[Notifications] Slack alert error:", err);
    return false;
  }
}

/**
 * Send embed alert to Discord Incoming Webhook
 */
export async function sendDiscordApprovalAlert(
  webhookUrl: string,
  alert: InterventionAlertPayload
): Promise<boolean> {
  if (!webhookUrl) return false;

  const approvalUrl = `${alert.baseUrl}/dashboard/agents?intervention=${alert.interventionId}`;

  const discordBody = {
    embeds: [
      {
        title: "⚠️ Irreversible Action Requested",
        description: `Agent **${alert.agentName}** requests confirmation to execute **${alert.actionName}**.`,
        color: 16738613, // Indigo-Rose Alert Color
        fields: [
          {
            name: "Agent",
            value: alert.agentName,
            inline: true
          },
          {
            name: "Action",
            value: alert.actionName,
            inline: true
          },
          {
            name: "Payload",
            value: `\`\`\`json\n${JSON.stringify(alert.payload, null, 2).slice(0, 1000)}\n\`\`\``
          }
        ],
        footer: {
          text: "AgentHelm HITL Governance"
        },
        timestamp: new Date().toISOString(),
        url: approvalUrl
      }
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5, // Link button
            label: "Open Dashboard Approval Queue",
            url: approvalUrl
          }
        ]
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordBody)
    });
    return res.ok;
  } catch (err) {
    console.error("[Notifications] Discord alert error:", err);
    return false;
  }
}
