/**
 * Brevo (Sendinblue) Transactional Email Client for Sabrang 2026
 *
 * Sends festival passes, QR registration tickets, and confirmation emails
 * using the official Brevo v3 REST API.
 */

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: { email: string; name: string };
  replyTo?: { email: string; name: string };
  attachment?: { url?: string; content?: string; name: string }[];
}

interface TicketPassParams {
  toEmail: string;
  toName: string;
  registrationId: string;
  eventName: string;
  collegeName?: string;
  qrCodeDataUrl: string;
  eventDate?: string;
  eventVenue?: string;
}

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const DEFAULT_SENDER = {
  email: process.env.BREVO_SENDER_EMAIL || "sabrang@jklu.edu.in",
  name: process.env.BREVO_SENDER_NAME || "Sabrang 2026 | JKLU",
};

/**
 * Low-level function to send any transactional email via Brevo.
 */
export async function sendBrevoEmail(params: SendEmailParams) {
  if (!BREVO_API_KEY) {
    console.warn("[Brevo] BREVO_API_KEY is not set. Email not sent.");
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: params.sender || DEFAULT_SENDER,
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        replyTo: params.replyTo || DEFAULT_SENDER,
        attachment: params.attachment,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Brevo Error]:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    return { success: true, messageId: data.messageId };
  } catch (error: any) {
    console.error("[Brevo Exception]:", error);
    return { success: false, error: error.message || "Network error" };
  }
}

/**
 * Sends a festival registration confirmation email with an embedded QR pass.
 */
export async function sendRegistrationPassEmail({
  toEmail,
  toName,
  registrationId,
  eventName,
  collegeName = "JK Lakshmipat University",
  qrCodeDataUrl,
  eventDate = "October 2026",
  eventVenue = "JKLU Campus, Jaipur",
}: TicketPassParams) {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Sabrang 2026 Festival Pass</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #06060c; font-family: 'Segoe UI', Arial, sans-serif; color: #ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #06060c; padding: 40px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 560px; background: linear-gradient(145deg, #120d20, #0a0714); border: 1px solid #2a1f45; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
            
            <!-- Header Banner -->
            <tr>
              <td style="padding: 36px 30px 24px; text-align: center; background: linear-gradient(180deg, rgba(147, 51, 234, 0.15), transparent);">
                <div style="font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #a855f7; font-weight: 700; margin-bottom: 8px;">
                  JK Lakshmipat University Presents
                </div>
                <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 0.05em; color: #ffffff;">
                  SABRANG <span style="color: #c084fc;">2026</span>
                </h1>
                <div style="font-size: 13px; color: #9ca3af; margin-top: 6px;">
                  Official Entry Pass & Registration Ticket
                </div>
              </td>
            </tr>

            <!-- Pass Content -->
            <tr>
              <td style="padding: 0 32px 28px;">
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; text-align: center;">
                  
                  <div style="color: #e2e8f0; font-size: 18px; font-weight: 700; margin-bottom: 4px;">
                    ${toName}
                  </div>
                  <div style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">
                    ${collegeName}
                  </div>

                  <!-- QR Code -->
                  <div style="background: #ffffff; padding: 16px; border-radius: 12px; display: inline-block; margin-bottom: 16px;">
                    <img src="${qrCodeDataUrl}" alt="Registration QR Code" width="180" height="180" style="display: block; border: 0;" />
                  </div>

                  <div style="font-family: monospace; font-size: 14px; letter-spacing: 0.1em; color: #c084fc; font-weight: 700; background: rgba(192, 132, 252, 0.1); padding: 8px 16px; border-radius: 6px; display: inline-block; margin-bottom: 20px;">
                    ID: ${registrationId}
                  </div>

                  <!-- Event Details Grid -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="text-align: left; font-size: 13px; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 10px;">
                    <tr>
                      <td style="color: #94a3b8; width: 35%;">Event / Category:</td>
                      <td style="font-weight: 600; color: #ffffff;">${eventName}</td>
                    </tr>
                    <tr>
                      <td style="color: #94a3b8;">Date:</td>
                      <td style="color: #ffffff;">${eventDate}</td>
                    </tr>
                    <tr>
                      <td style="color: #94a3b8;">Venue:</td>
                      <td style="color: #ffffff;">${eventVenue}</td>
                    </tr>
                  </table>
                </div>

                <div style="margin-top: 24px; padding: 14px; background: rgba(168, 85, 247, 0.08); border-left: 3px solid #a855f7; border-radius: 6px; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                  <strong>Important Entry Guidelines:</strong><br/>
                  • Please keep this QR code ready on your phone at the entry gates.<br/>
                  • A valid College/University photo ID card is mandatory for verification.<br/>
                  • This pass is strictly non-transferable.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px 28px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: #64748b;">
                <div>JK Lakshmipat University, Near Mahindra SEZ, Jaipur - 302026</div>
                <div style="margin-top: 6px;">Need help? Email <a href="mailto:sabrang@jklu.edu.in" style="color: #a855f7; text-decoration: none;">sabrang@jklu.edu.in</a></div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  return sendBrevoEmail({
    to: [{ email: toEmail, name: toName }],
    subject: `Your Festival Pass for ${eventName} | Sabrang 2026 (Pass ID: ${registrationId})`,
    htmlContent,
    textContent: `Hi ${toName}, your pass for ${eventName} at Sabrang 2026 is confirmed! Pass ID: ${registrationId}. Present your QR code at the campus entry gates.`,
  });
}
