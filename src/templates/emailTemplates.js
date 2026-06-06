/**
 * Reusable HTML email templates for ProEduvate TestSync
 */

const baseLayout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f3f4f6;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 40px 32px;
      line-height: 1.6;
      font-size: 16px;
    }
    h2 {
      color: #111827;
      font-size: 20px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff !important;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
    }
    .details-box {
      background-color: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .details-row {
      margin-bottom: 12px;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 12px;
    }
    .details-row:last-child {
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .details-label {
      font-weight: 600;
      color: #4b5563;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .details-value {
      color: #111827;
      font-size: 16px;
      margin-top: 4px;
      font-weight: 550;
    }
    .alert-banner {
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      font-weight: 500;
    }
    .alert-banner.success {
      background-color: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .alert-banner.warning {
      background-color: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .alert-banner.danger {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>ProEduvate TestSync</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>This is an automated system notification from ProEduvate.</p>
        <p>&copy; 2026 ProEduvate. All rights reserved.</p>
        <p>
          <a href="https://proeduvate.com">Platform Dashboard</a> &nbsp;|&nbsp; 
          <a href="mailto:support@proeduvate.com">Help & Support</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const welcomeEmail = (name, role) => baseLayout(
  'Welcome to ProEduvate!',
  `
  <h2>Welcome to the Family, ${name}! 🎉</h2>
  <p>Thank you for registering on ProEduvate TestSync. We are thrilled to have you join our platform as a <strong>${role}</strong>.</p>
  
  <div class="alert-banner success">
    Status: Pending Admin Approval
  </div>
  
  <p>Our team is currently reviewing your registration details to ensure you have the best experience on the platform. We'll notify you as soon as your account is approved and activated.</p>
  
  <p>Here's what you can look forward to:</p>
  <ul>
    ${role === 'developer' 
      ? '<li>Post testing tasks for your software products.</li><li>Get quality feedback and detailed bug reports from professional testers.</li><li>Securely pay and manage testing budgets.</li>'
      : '<li>Browse and apply for diverse software testing projects.</li><li>Earn credits for high-quality, verified testing feedback.</li><li>Withdraw earnings directly to your integrated wallet.</li>'
    }
  </ul>
  
  <div class="button-container">
    <a href="https://proeduvate.com/login" class="button">Go to Dashboard</a>
  </div>
  `
);

export const taskAssigned = (taskName, testerName, deadline, budget, role = 'developer') => baseLayout(
  'Task Assigned Notification',
  role === 'developer'
  ? `
    <h2>Tester Assigned to Your Task! 🧪</h2>
    <p>Good news! A qualified tester has been assigned to your testing project.</p>
    
    <div class="details-box">
      <div class="details-row">
        <div class="details-label">Task Name</div>
        <div class="details-value">${taskName}</div>
      </div>
      <div class="details-row">
        <div class="details-label">Assigned Tester</div>
        <div class="details-value">${testerName}</div>
      </div>
      <div class="details-row">
        <div class="details-label">Task Deadline</div>
        <div class="details-value">${deadline}</div>
      </div>
      <div class="details-row">
        <div class="details-label">Allocated Budget</div>
        <div class="details-value">${budget} Credits</div>
      </div>
    </div>
    
    <p>The tester will now begin performing checks on your application. You will be notified as soon as they submit their feedback.</p>
    
    <div class="button-container">
      <a href="https://proeduvate.com/developer/tasks" class="button">View Task Progress</a>
    </div>
    `
  : `
    <h2>You have been assigned a new task! 📝</h2>
    <p>You have successfully applied and been assigned to a new software testing task.</p>
    
    <div class="details-box">
      <div class="details-row">
        <div class="details-label">Task Name</div>
        <div class="details-value">${taskName}</div>
      </div>
      <div class="details-row">
        <div class="details-label">Deadline</div>
        <div class="details-value">${deadline}</div>
      </div>
      <div class="details-row">
        <div class="details-label">Reward Amount</div>
        <div class="details-value">${budget} Credits</div>
      </div>
    </div>
    
    <p>Please make sure to review the instructions carefully, test the application, and submit your feedback proof before the deadline.</p>
    
    <div class="button-container">
      <a href="https://proeduvate.com/tester/my-tasks" class="button">Start Testing Now</a>
    </div>
    `
);

export const taskSubmitted = (taskName, testerName, submissionDate, role = 'developer') => baseLayout(
  'Task Feedback Submitted',
  role === 'developer'
  ? `
    <h2>New Test Feedback Submitted! 📝</h2>
    <p>A tester has submitted feedback for your testing project.</p>
    
    <div class="details-box">
      <div class="details-row">
        <div class="details-label">Task Name</div>
        <div class="details-value">${taskName}</div>
      </div>
      <div class="details-row">
        <div class="details-label">Tester Name</div>
        <div class="details-value">${testerName}</div>
      </div>
      <div class="details-row">
        <div class="details-label">Submission Date</div>
        <div class="details-value">${submissionDate}</div>
      </div>
    </div>
    
    <p>Please log in to your dashboard to review the submission, inspect the proof, and release the credits.</p>
    
    <div class="button-container">
      <a href="https://proeduvate.com/developer/feedback" class="button">Review Submission</a>
    </div>
    `
  : `
    <h2>Submission Confirmed! ✅</h2>
    <p>Your testing feedback for the task has been successfully received.</p>
    
    <div class="details-box">
      <div class="details-row">
        <div class="details-label">Task Name</div>
        <div class="details-value">${taskName}</div>
      </div>
      <div class="details-row">
        <div class="details-label">Submitted At</div>
        <div class="details-value">${submissionDate}</div>
      </div>
    </div>
    
    <p>The developer is currently reviewing your submission. You will be notified once credits are released or if revisions are requested.</p>
    `
);

export const taskCompleted = (taskName, credits, role = 'developer') => baseLayout(
  'Task Completed & Credits Released',
  `
  <h2>Task Successfully Completed! 🎉</h2>
  <p>The testing project has been marked as completed.</p>
  
  <div class="details-box">
    <div class="details-row">
      <div class="details-label">Project Name</div>
      <div class="details-value">${taskName}</div>
    </div>
    <div class="details-row">
      <div class="details-label">Total Credits</div>
      <div class="details-value">${credits} Credits</div>
    </div>
    <div class="details-row">
      <div class="details-label">Status</div>
      <div class="details-value">Completed & Closed</div>
    </div>
  </div>
  
  <p>${role === 'developer' 
    ? 'All testing criteria have been met and the feedback has been approved. The tester has been paid.'
    : 'Your submission was approved and your reward has been credited to your platform wallet.'
  }</p>
  
  <div class="button-container">
    <a href="https://proeduvate.com/login" class="button">View Wallet / Transactions</a>
  </div>
  `
);

export const paymentSuccess = (name, amount, invoiceNo, taskName) => baseLayout(
  'Payment Successful',
  `
  <h2>Payment Success & Invoice Receipt 💳</h2>
  <p>Hello ${name}, thank you for your payment. Your transaction was processed successfully, and your task is now live.</p>
  
  <div class="alert-banner success">
    Transaction Status: COMPLETED
  </div>
  
  <div class="details-box">
    <div class="details-row">
      <div class="details-label">Invoice Number</div>
      <div class="details-value">${invoiceNo}</div>
    </div>
    <div class="details-row">
      <div class="details-label">Amount Paid</div>
      <div class="details-value">${amount} Credits</div>
    </div>
    <div class="details-row">
      <div class="details-label">Associated Project</div>
      <div class="details-value">${taskName}</div>
    </div>
    <div class="details-row">
      <div class="details-label">Date</div>
      <div class="details-value">${new Date().toLocaleDateString()}</div>
    </div>
  </div>
  
  <p>You can download the full PDF invoice directly from your billing dashboard.</p>
  
  <div class="button-container">
    <a href="https://proeduvate.com/developer/payments" class="button">Billing Dashboard</a>
  </div>
  `
);

export const paymentFailure = (name, amount, errorMessage) => baseLayout(
  'Payment Failed',
  `
  <h2>Payment Transaction Failed ❌</h2>
  <p>Hello ${name}, we were unable to process your payment transaction.</p>
  
  <div class="alert-banner danger">
    Transaction Status: FAILED
  </div>
  
  <div class="details-box">
    <div class="details-row">
      <div class="details-label">Attempted Amount</div>
      <div class="details-value">${amount} Credits</div>
    </div>
    <div class="details-row">
      <div class="details-label">Reason for Failure</div>
      <div class="details-value" style="color: #ef4444;">${errorMessage || 'Declined by bank / Card limit exceeded'}</div>
    </div>
    <div class="details-row">
      <div class="details-label">Timestamp</div>
      <div class="details-value">${new Date().toLocaleString()}</div>
    </div>
  </div>
  
  <p>Please check your payment details or try using an alternative payment method to complete the transaction.</p>
  
  <div class="button-container">
    <a href="https://proeduvate.com/developer/create-task" class="button">Try Payment Again</a>
  </div>
  `
);

export const accountApproved = (name, role) => baseLayout(
  'Account Approved!',
  `
  <h2>Account Approved! 🎉</h2>
  <p>Hello ${name}, we have exciting news! Your ProEduvate TestSync enrollment request has been approved by our administrators.</p>
  
  <div class="alert-banner success">
    Account Status: ACTIVE
  </div>
  
  <p>Your account is now fully active, and you have been granted access to your dashboard as a <strong>${role}</strong>.</p>
  
  <p>${role === 'developer'
    ? 'You can now set up your profile, deposit credits, and start posting software testing tasks.'
    : 'You can now browse the marketplace, apply for tasks, and start earning rewards.'
  }</p>
  
  <div class="button-container">
    <a href="https://proeduvate.com/login" class="button">Log In to Your Account</a>
  </div>
  `
);

export const accountRejected = (name, reason) => baseLayout(
  'Account Registration Update',
  `
  <h2>Account Enrollment Status 🚫</h2>
  <p>Hello ${name}, thank you for applying to ProEduvate TestSync.</p>
  
  <div class="alert-banner danger">
    Account Status: DECLINED
  </div>
  
  <p>After reviewing your application, our team regretfully informs you that your registration could not be approved at this time.</p>
  
  <div class="details-box">
    <div class="details-row">
      <div class="details-label">Reason for rejection</div>
      <div class="details-value">${reason || 'Incomplete profile details or unsupported testing background.'}</div>
    </div>
  </div>
  
  <p>If you believe this was in error, or if you would like to provide additional information, please contact our support team.</p>
  `
);

export const passwordReset = (name, resetLinkOrCode) => baseLayout(
  'Reset Your Password',
  `
  <h2>Password Reset Request 🔑</h2>
  <p>Hello ${name}, we received a request to reset the password for your ProEduvate account.</p>
  
  <p>If you made this request, please click the button below to set a new password:</p>
  
  <div class="button-container">
    <a href="${resetLinkOrCode}" class="button">Reset Password</a>
  </div>
  
  <p>If you did not request a password reset, you can safely ignore this email. Your password will remain secure.</p>
  
  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
  <p style="font-size: 12px; color: #9ca3af;">If you are having trouble clicking the button, copy and paste this URL into your browser:</p>
  <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">${resetLinkOrCode}</p>
  `
);

export const projectStatusUpdate = (projectName, oldStatus, newStatus, role = 'developer') => baseLayout(
  'Project Status Updated',
  `
  <h2>Project Status Changed 🔄</h2>
  <p>The status of the project <strong>${projectName}</strong> has been updated.</p>
  
  <div class="details-box">
    <div class="details-row">
      <div class="details-label">Project Name</div>
      <div class="details-value">${projectName}</div>
    </div>
    <div class="details-row">
      <div class="details-label">Previous Status</div>
      <div class="details-value" style="text-transform: capitalize;">${oldStatus}</div>
    </div>
    <div class="details-row">
      <div class="details-label">New Status</div>
      <div class="details-value" style="text-transform: capitalize; color: #4f46e5; font-weight: bold;">${newStatus}</div>
    </div>
  </div>
  
  <p>Please log in to check the latest updates on this project.</p>
  
  <div class="button-container">
    <a href="https://proeduvate.com/login" class="button">View Dashboard</a>
  </div>
  `
);
