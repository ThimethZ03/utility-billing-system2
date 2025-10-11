// services/emailServiceWeb3.js

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || 'YOUR_ACCESS_KEY_HERE';

/**
 * Send alert email using Web3Forms
 */
export const sendAlertEmail = async ({
  toEmails,
  alertType,
  alertTitle,
  alertMessage,
  currentValue,
  limitValue,
  percentage
}) => {
  try {
    const results = [];

    for (const email of toEmails) {
      const formData = new FormData();
      
      // Web3Forms required fields
      formData.append('access_key', WEB3FORMS_ACCESS_KEY);
      formData.append('subject', `⚠️ ${alertTitle} - Smart Utilities`);
      formData.append('from_name', 'Smart Utilities Alert System');
      formData.append('to_email', email);
      
      // Custom fields
      formData.append('alert_type', alertType);
      formData.append('alert_title', alertTitle);
      formData.append('current_value', currentValue.toLocaleString('en-IN'));
      formData.append('limit_value', limitValue.toLocaleString('en-IN'));
      formData.append('percentage', `${percentage}%`);
      formData.append('alert_date', new Date().toLocaleString('en-IN'));
      formData.append('message', alertMessage);
      
      // Custom HTML email
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 30px; text-align: center; }
            .content { background: #ffffff; padding: 30px; }
            .alert-box { border-left: 4px solid ${alertType === 'units' ? '#f59e0b' : '#ef4444'}; background: ${alertType === 'units' ? '#fffbeb' : '#fef2f2'}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .stat { text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #ef4444; }
            .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
            .progress { background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden; margin: 15px 0; }
            .progress-bar { background: linear-gradient(90deg, #f59e0b, #ef4444); height: 100%; width: ${Math.min(percentage, 100)}%; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ ${alertTitle}</h1>
              <p>Smart Utility Manager</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <h2>${alertTitle}</h2>
                <p>${alertMessage}</p>
                
                <div class="stats">
                  <div class="stat">
                    <div class="stat-value">${currentValue.toLocaleString('en-IN')}</div>
                    <div class="stat-label">Current ${alertType === 'units' ? 'Units' : 'Amount'}</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${limitValue.toLocaleString('en-IN')}</div>
                    <div class="stat-label">Set Limit</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${percentage}%</div>
                    <div class="stat-label">Usage</div>
                  </div>
                </div>

                <div class="progress">
                  <div class="progress-bar"></div>
                </div>

                <p><strong>Date:</strong> ${new Date().toLocaleString('en-IN')}</p>
              </div>

              <p>This is an automated alert from Smart Utility Manager.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Smart Utilities. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      formData.append('html', htmlContent);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      results.push({ email, success: result.success });
    }

    const successful = results.filter(r => r.success).length;

    return {
      success: successful > 0,
      sent: successful,
      failed: results.length - successful,
      total: results.length
    };

  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send test email
 */
export const sendTestEmail = async (email) => {
  return sendAlertEmail({
    toEmails: [email],
    alertType: 'test',
    alertTitle: 'Test Alert',
    alertMessage: 'This is a test email to verify your email configuration.',
    currentValue: 1500,
    limitValue: 1000,
    percentage: 150
  });
};

/**
 * Send threshold alert
 */
export const sendThresholdAlert = async (settings, alertData) => {
  if (!settings.enableEmailAlerts || !settings.alertEmails?.length) {
    return { success: false, error: 'Email alerts disabled' };
  }

  const { type, current, limit, percentage } = alertData;

  return sendAlertEmail({
    toEmails: settings.alertEmails,
    alertType: type,
    alertTitle: type === 'units' ? 'Monthly Units Exceeded' : 'Monthly Budget Exceeded',
    alertMessage: type === 'units'
      ? `Your utility consumption (${current} units) has exceeded the limit of ${limit} units (${percentage}%).`
      : `Your monthly spending (Rs. ${current.toLocaleString('en-IN')}) has exceeded the budget of Rs. ${limit.toLocaleString('en-IN')} (${percentage}%).`,
    currentValue: current,
    limitValue: limit,
    percentage
  });
};
