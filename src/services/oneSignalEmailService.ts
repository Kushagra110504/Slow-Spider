import { ReminderTier } from '../types/database';

export interface SendDeadlineEmailParams {
  recipientEmail: string;
  recipientName: string;
  taskTitle: string;
  projectName: string;
  entityType: 'task' | 'milestone' | 'project';
  entityId: string;
  tier: ReminderTier;
  dueDate: string;
  timeRemainingText: string;
  projectUrl?: string;
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY || '';

class OneSignalEmailService {
  public isConfigured(): boolean {
    return Boolean(ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY);
  }

  private getSubjectLine(title: string, tier: ReminderTier): string {
    switch (tier) {
      case '24h':
        return `⏳ 1 day remaining: "${title}"`;
      case '12h':
        return `⚠️ 12 hours left: "${title}"`;
      case '1h':
        return `🚨 FINAL HOUR: "${title}" is due in 60 minutes!`;
    }
  }

  private getTierStyling(tier: ReminderTier): { badgeColor: string; badgeBg: string; bannerText: string; alertIcon: string } {
    switch (tier) {
      case '24h':
        return {
          badgeColor: '#F59E0B',
          badgeBg: 'rgba(245, 158, 11, 0.15)',
          bannerText: 'Deadline Approaching in 24 Hours',
          alertIcon: '⏳',
        };
      case '12h':
        return {
          badgeColor: '#F97316',
          badgeBg: 'rgba(249, 115, 22, 0.15)',
          bannerText: 'Urgent: 12 Hours Remaining',
          alertIcon: '⚠️',
        };
      case '1h':
        return {
          badgeColor: '#EF4444',
          badgeBg: 'rgba(239, 68, 68, 0.18)',
          bannerText: 'Final Call: 1 Hour Remaining',
          alertIcon: '🚨',
        };
    }
  }

  private generateHtmlTemplate(params: SendDeadlineEmailParams): string {
    const { badgeColor, badgeBg, bannerText, alertIcon } = this.getTierStyling(params.tier);
    const appUrl = params.projectUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://slow-spider.app');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.getSubjectLine(params.taskTitle, params.tier)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0D0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E6F4EA;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0A0D0B;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#111613;border:1px solid #1F2E23;border-radius:18px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
          
          <!-- Header Branding -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #1F2E23;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:20px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
                      <span style="color:#00E575;">⚡</span> Slow Spider
                    </div>
                    <div style="font-size:11px;color:#85998D;margin-top:2px;font-weight:500;">
                      Task & Milestone Deadline Alert
                    </div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:5px 12px;background:${badgeBg};color:${badgeColor};border:1px solid ${badgeColor}40;border-radius:999px;font-size:11px;font-weight:700;">
                      ${alertIcon} ${params.timeRemainingText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding:20px 32px 12px;background:rgba(0,229,117,0.03);">
              <p style="margin:0;font-size:14px;color:${badgeColor};font-weight:700;">
                ${bannerText}
              </p>
              <h2 style="margin:8px 0 0;font-size:18px;color:#FFFFFF;line-height:1.4;">
                Hi ${params.recipientName || 'there'}, your assigned ${params.entityType} is due soon.
              </h2>
            </td>
          </tr>

          <!-- Task Card -->
          <tr>
            <td style="padding:16px 32px 24px;">
              <table role="presentation" width="100%" style="background:#161D18;border:1px solid #233528;border-radius:14px;padding:20px;" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:11px;color:#85998D;text-transform:uppercase;letter-spacing:0.6px;font-weight:700;">
                      ${params.projectName}
                    </div>
                    <div style="font-size:16px;font-weight:700;color:#00E575;margin-top:6px;line-height:1.4;">
                      ${params.taskTitle}
                    </div>
                    
                    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #1F2E23;display:flex;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="font-size:12px;color:#85998D;">
                            <strong>Due:</strong> ${new Date(params.dueDate).toLocaleString()}
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background:#00E575;color:#042B16;font-size:13px;font-weight:800;text-decoration:none;border-radius:12px;box-shadow:0 4px 14px rgba(0,229,117,0.35);">
                      Open in Slow Spider &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1F2E23;background:#0D120F;text-align:center;">
              <p style="margin:0;font-size:11px;color:#607367;line-height:1.5;">
                You received this email because you are assigned to this item in Slow Spider.<br>
                To adjust notification preferences, visit your Slow Spider User Profile.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  public async sendDeadlineEmail(params: SendDeadlineEmailParams): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
    const subject = this.getSubjectLine(params.taskTitle, params.tier);
    const htmlBody = this.generateHtmlTemplate(params);

    if (!this.isConfigured()) {
      console.info(
        `%c[OneSignal Email Simulated] %c${params.tier.toUpperCase()} alert for "${params.taskTitle}" -> ${params.recipientEmail}`,
        'color: #00E575; font-weight: bold;',
        'color: #85998D;',
        { subject, recipient: params.recipientEmail, timeRemaining: params.timeRemainingText }
      );
      return { success: true, simulated: true };
    }

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_email_tokens: [params.recipientEmail],
          email_subject: subject,
          email_body: htmlBody,
          custom_data: {
            entity_type: params.entityType,
            entity_id: params.entityId,
            reminder_tier: params.tier,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('OneSignal Email API error:', errorText);
        return { success: false, error: errorText };
      }

      return { success: true };
    } catch (err: any) {
      console.warn('OneSignal Email dispatch failed:', err);
      return { success: false, error: err.message || 'Dispatch error' };
    }
  }
}

export const oneSignalEmailService = new OneSignalEmailService();
