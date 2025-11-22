const nodemailer = require('nodemailer');

// Create reusable transporter object
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
  const emailPass = process.env.EMAIL_PASSWORD;
  
  console.log('Creating email transporter with user:', emailUser); // Debug log
  
  // If using Gmail or Google Workspace, use 'gmail' service
  // Otherwise, use custom SMTP configuration
  if (emailUser.includes('@gmail.com') || emailUser.includes('@googlemail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  } else {
    // For custom domains, use SMTP configuration
    // You may need to adjust these settings based on your email provider
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }
};

// Welcome email template
const getWelcomeEmailTemplate = (firstName, lastName) => {
  const name = firstName || 'there';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Staffdox</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
            <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    <span style="display: inline-block; margin-right: 8px;">💼</span>
                    Staffdox
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                    Your Career Partner
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                    Welcome to Staffdox, ${name}! 🎉
                  </h2>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Thank you for joining Staffdox! We're thrilled to have you as part of our community of professionals and job seekers.
                  </p>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your account has been successfully created. Now you can:
                  </p>
                  
                  <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                    <li>Browse and search for exciting job opportunities</li>
                    <li>Apply to jobs that match your skills and interests</li>
                    <li>Complete your profile to increase your visibility to employers</li>
                    <li>Receive personalized job recommendations and notifications</li>
                    <li>Track your application status in real-time</li>
                  </ul>
                  
                  <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: bold;">
                      💡 Pro Tip:
                    </p>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                      Complete your profile with your resume, skills, and experience to get the best job matches and increase your chances of landing your dream job!
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" 
                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Get Started Now →
                    </a>
                  </div>
                  
                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    If you have any questions or need assistance, feel free to reach out to our support team. We're here to help you succeed!
                  </p>
                  
                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Best regards,<br>
                    <strong>The Staffdox Team</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                    This email was sent to you because you created an account on Staffdox.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                    © ${new Date().getFullYear()} Staffdox. All rights reserved.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
                    <a href="mailto:support@staffdox.com" style="color: #2563eb; text-decoration: none;">Contact Support</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Employer welcome email template
const getEmployerWelcomeEmailTemplate = (firstName, lastName, companyName) => {
  const name = firstName || 'there';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Staffdox Employer Portal</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
            <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    <span style="display: inline-block; margin-right: 8px;">🏢</span>
                    Staffdox Employer Portal
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                    Your Talent Acquisition Partner
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                    Welcome to Staffdox, ${name}! 🎉
                  </h2>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Thank you for choosing Staffdox as your recruitment partner! We're excited to help ${companyName || 'your company'} find the best talent.
                  </p>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your employer account has been successfully created. Here's what you can do next:
                  </p>
                  
                  <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                    <li>📋 <strong>Choose Your Plan:</strong> Select a subscription plan that fits your hiring needs</li>
                    <li>💼 <strong>Post Job Openings:</strong> Create and publish job listings to reach qualified candidates</li>
                    <li>👥 <strong>Access Candidate Database:</strong> Browse through our extensive pool of talented professionals</li>
                    <li>📊 <strong>Manage Applications:</strong> Review, shortlist, and manage candidate applications efficiently</li>
                    <li>🔍 <strong>Advanced Screening:</strong> Use AI-powered tools to find the perfect match for your roles</li>
                    <li>📈 <strong>Track Analytics:</strong> Monitor your job postings' performance and candidate engagement</li>
                  </ul>
                  
                  <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; color: #92400e; font-size: 16px; font-weight: bold;">
                      ⚡ Next Steps:
                    </p>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                      To start posting jobs and accessing our candidate database, please subscribe to one of our plans. Choose from Starter, Professional, or Enterprise plans based on your hiring volume and requirements.
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/employer/login" 
                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Access Your Dashboard →
                    </a>
                  </div>
                  
                  <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: bold;">
                      💡 Need Help?
                    </p>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                      Our dedicated support team is here to assist you. Whether you need help setting up your account, choosing the right plan, or have questions about our features, we're just an email away!
                    </p>
                  </div>
                  
                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    We're committed to helping you build a strong team. Let's find the perfect candidates together!
                  </p>
                  
                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Best regards,<br>
                    <strong>The Staffdox Employer Team</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                    This email was sent to you because you created an employer account on Staffdox.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                    © ${new Date().getFullYear()} Staffdox. All rights reserved.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
                    <a href="mailto:info@staffdox.co.in" style="color: #2563eb; text-decoration: none;">Contact Support</a> | 
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/employer/login" style="color: #2563eb; text-decoration: none;"> Employer Login</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Send welcome email
const sendWelcomeEmail = async (email, firstName, lastName) => {
  try {
    // Only send email if credentials are configured
    if (!process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured. Skipping welcome email.');
      return { success: false, message: 'Email service not configured' };
    }

    const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
    console.log('Sending email from:', emailUser); // Debug log
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `Staffdox <${emailUser}>`,
      to: email,
      subject: '🎉 Welcome to Staffdox - Your Career Journey Starts Here!',
      html: getWelcomeEmailTemplate(firstName, lastName),
      text: `Welcome to Staffdox, ${firstName || 'there'}!\n\nThank you for joining Staffdox! We're thrilled to have you as part of our community.\n\nYour account has been successfully created. You can now browse jobs, apply to positions, and track your applications.\n\nComplete your profile to get the best job matches!\n\nBest regards,\nThe Staffdox Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error - registration should succeed even if email fails
    return { success: false, error: error.message };
  }
};

// Send employer welcome email
const sendEmployerWelcomeEmail = async (email, firstName, lastName, companyName) => {
  try {
    // Only send email if credentials are configured
    if (!process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured. Skipping employer welcome email.');
      return { success: false, message: 'Email service not configured' };
    }

    const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
    console.log('Sending employer welcome email from:', emailUser); // Debug log
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `Staffdox Employer Portal <${emailUser}>`,
      to: email,
      subject: '🎉 Welcome to Staffdox Employer Portal - Start Hiring Top Talent!',
      html: getEmployerWelcomeEmailTemplate(firstName, lastName, companyName),
      text: `Welcome to Staffdox Employer Portal, ${firstName || 'there'}!\n\nThank you for choosing Staffdox as your recruitment partner! We're excited to help ${companyName || 'your company'} find the best talent.\n\nYour employer account has been successfully created. You can now:\n- Choose your subscription plan\n- Post job openings\n- Access candidate database\n- Manage applications\n- Use advanced screening tools\n- Track analytics\n\nTo start posting jobs, please subscribe to one of our plans from your dashboard.\n\nBest regards,\nThe Staffdox Employer Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Employer welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending employer welcome email:', error);
    // Don't throw error - registration should succeed even if email fails
    return { success: false, error: error.message };
  }
};

// Newsletter subscription confirmation email template
const getSubscriptionConfirmationTemplate = (unsubscribeLink) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Subscribing</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
            <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    <span style="display: inline-block; margin-right: 8px;">💼</span>
                    Staffdox
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                    Your Career Partner
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                    Thank You for Subscribing! 🎉
                  </h2>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We're excited to have you on board! You've successfully subscribed to our newsletter and will now receive:
                  </p>
                  
                  <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                    <li>📧 Latest job opportunities matching your interests</li>
                    <li>💼 Career tips and industry insights</li>
                    <li>🚀 Exclusive job openings before they're public</li>
                    <li>📊 Market trends and salary information</li>
                  </ul>
                  
                  <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                      <strong>What's next?</strong> Keep an eye on your inbox! We'll send you the latest job opportunities and career resources to help you advance your career.
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/jobs" 
                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Browse Jobs Now →
                    </a>
                  </div>
                  
                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    If you have any questions or need assistance, feel free to reach out to our support team.
                  </p>
                  
                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Best regards,<br>
                    <strong>The Staffdox Team</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                    You're receiving this email because you subscribed to our newsletter.
                  </p>
                  <p style="margin: 10px 0; color: #6b7280; font-size: 12px;">
                    <a href="${unsubscribeLink}" style="color: #2563eb; text-decoration: none;">Unsubscribe</a> | 
                    <a href="mailto:${process.env.EMAIL_USER || 'info@staffdox.co.in'}" style="color: #2563eb; text-decoration: none;">Contact Support</a>
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                    © ${new Date().getFullYear()} Staffdox. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Job notification email template
const getJobNotificationTemplate = (job) => {
  const salaryText = job.salary?.min && job.salary?.max 
    ? `₹${job.salary.min.toLocaleString()} - ₹${job.salary.max.toLocaleString()} ${job.salary.currency || 'INR'}`
    : job.salary?.min 
    ? `₹${job.salary.min.toLocaleString()}+ ${job.salary.currency || 'INR'}`
    : 'Not specified';
  
  const jobUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/jobs/${job._id}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Job Opportunity</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
            <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                    <span style="display: inline-block; margin-right: 8px;">💼</span>
                    New Job Opportunity
                  </h1>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 30px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 22px; line-height: 1.3;">
                    ${job.title}
                  </h2>
                  
                  <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">
                          <strong style="color: #1f2937;">Company:</strong> ${job.company}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">
                          <strong style="color: #1f2937;">Location:</strong> ${job.location}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">
                          <strong style="color: #1f2937;">Type:</strong> ${job.employmentType || 'Full-time'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">
                          <strong style="color: #1f2937;">Salary:</strong> ${salaryText}
                        </td>
                      </tr>
                      ${job.category ? `
                      <tr>
                        <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">
                          <strong style="color: #1f2937;">Category:</strong> ${job.category}
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>
                  
                  ${job.description ? `
                  <div style="margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">Job Description</h3>
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                      ${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}
                    </p>
                  </div>
                  ` : ''}
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${jobUrl}" 
                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      View & Apply Now →
                    </a>
                  </div>
                  
                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 12px; line-height: 1.6;">
                    This job was posted on ${new Date(job.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                    You're receiving this email because you subscribed to our job alerts.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                    © ${new Date().getFullYear()} Staffdox. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Send subscription confirmation email
const sendSubscriptionConfirmation = async (email, unsubscribeToken) => {
  try {
    if (!process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured. Skipping subscription confirmation email.');
      return { success: false, message: 'Email service not configured' };
    }

    const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
    const unsubscribeLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/unsubscribe?token=${unsubscribeToken}`;
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `Staffdox <${emailUser}>`,
      to: email,
      subject: '🎉 Thank You for Subscribing to Staffdox Newsletter!',
      html: getSubscriptionConfirmationTemplate(unsubscribeLink),
      text: `Thank You for Subscribing!\n\nWe're excited to have you on board! You've successfully subscribed to our newsletter and will now receive:\n\n- Latest job opportunities matching your interests\n- Career tips and industry insights\n- Exclusive job openings before they're public\n- Market trends and salary information\n\nKeep an eye on your inbox! We'll send you the latest job opportunities and career resources.\n\nBest regards,\nThe Staffdox Team\n\nUnsubscribe: ${unsubscribeLink}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Subscription confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send job notification to all subscribers
const sendJobNotificationToSubscribers = async (job) => {
  try {
    if (!process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured. Skipping job notification emails.');
      return { success: false, message: 'Email service not configured' };
    }

    const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
    const NewsletterSubscriber = require('../models/NewsletterSubscriber');
    const subscribers = await NewsletterSubscriber.find({ isActive: true });
    
    if (subscribers.length === 0) {
      console.log('No active subscribers to notify.');
      return { success: true, sent: 0 };
    }

    const transporter = createTransporter();
    let sentCount = 0;
    let failedCount = 0;

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (subscriber) => {
          try {
            const mailOptions = {
              from: `Staffdox <${emailUser}>`,
              to: subscriber.email,
              subject: `💼 New Job Opportunity: ${job.title} at ${job.company}`,
              html: getJobNotificationTemplate(job),
              text: `New Job Opportunity\n\n${job.title}\n${job.company}\n${job.location}\n\n${job.description ? job.description.substring(0, 200) : ''}\n\nView & Apply: ${process.env.CLIENT_URL || 'http://localhost:3000'}/jobs/${job._id}`
            };

            await transporter.sendMail(mailOptions);
            sentCount++;
          } catch (error) {
            console.error(`Failed to send job notification to ${subscriber.email}:`, error);
            failedCount++;
          }
        })
      );
    }

    console.log(`Job notification sent to ${sentCount} subscribers. Failed: ${failedCount}`);
    return { success: true, sent: sentCount, failed: failedCount };
  } catch (error) {
    console.error('Error sending job notifications:', error);
    return { success: false, error: error.message };
  }
};

// Password reset email template
const getPasswordResetTemplate = (resetLink, email, isEmployer = false) => {
  const accountType = isEmployer ? 'employer account' : 'account';
  const accountContext = isEmployer ? 'your Staffdox employer account' : 'your Staffdox account';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
            <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    <span style="display: inline-block; margin-right: 8px;">💼</span>
                    Staffdox
                  </h1>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                    Hi ${email}, Forgot Your Password? No Problem! 🔐
                  </h2>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password for ${accountContext}. Don't worry, it happens to the best of us!
                  </p>
                  
                  <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Click the button below to reset your password. This link will expire in 1 hour and can only be used once.
                  </p>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${resetLink}" 
                           style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 10px 0 0 0; color: #2563eb; font-size: 14px; word-break: break-all;">
                    ${resetLink}
                  </p>
                  
                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                  </p>
                  
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                    <strong>Security Note:</strong> This link is valid for 1 hour and can only be used once. For security reasons, if you need to reset your password again, please request a new reset link.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong>The Staffdox Team</strong>
                  </p>
                  <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Staffdox. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetLink, isEmployer = false) => {
  try {
    if (!process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured. Skipping password reset email.');
      return { success: false, message: 'Email service not configured' };
    }

    const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
    const transporter = createTransporter();
    const accountContext = isEmployer ? 'your Staffdox employer account' : 'your Staffdox account';
    
    const mailOptions = {
      from: `"Staffdox" <${emailUser}>`,
      to: email,
      subject: 'Reset Your Password - Staffdox',
      html: getPasswordResetTemplate(resetLink, email, isEmployer),
      text: `Hi ${email}, Forgot Your Password? No Problem!\n\nWe received a request to reset your password for ${accountContext}. Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 1 hour and can only be used once.\n\nIf you didn't request a password reset, please ignore this email.\n\nBest regards,\nThe Staffdox Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Contact form email template (to admin)
const getContactEmailTemplate = (contactData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
            <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    <span style="display: inline-block; margin-right: 8px;">💼</span>
                    Staffdox
                  </h1>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                    New Contact Form Submission
                  </h2>
                  
                  <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 20px;">
                    <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      <strong style="color: #1f2937;">Name:</strong> ${contactData.name}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      <strong style="color: #1f2937;">Email:</strong> <a href="mailto:${contactData.email}" style="color: #2563eb; text-decoration: none;">${contactData.email}</a>
                    </p>
                    <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      <strong style="color: #1f2937;">Subject:</strong> ${contactData.subject}
                    </p>
                  </div>
                  
                  <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">Message:</h3>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${contactData.message}</p>
                    </div>
                  </div>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      You can reply directly to this email to respond to ${contactData.name}.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    This is an automated notification from Staffdox Contact Form
                  </p>
                  <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Staffdox. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Contact confirmation email template (to sender)
const getContactConfirmationTemplate = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Contacting Us</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
            <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    <span style="display: inline-block; margin-right: 8px;">💼</span>
                    Staffdox
                  </h1>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                    Thank You for Contacting Us! 🙏
                  </h2>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Hi ${name || 'there'},
                  </p>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We have received your message and appreciate you taking the time to reach out to us. Our team will review your inquiry and get back to you as soon as possible.
                  </p>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We typically respond within 24-48 hours during business days.
                  </p>
                  
                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Thank you for choosing Staffdox!
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong>The Staffdox Team</strong>
                  </p>
                  <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Staffdox. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Send contact form email to admin
const sendContactEmail = async (contactData) => {
  try {
    if (!process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured. Skipping contact email.');
      return { success: false, message: 'Email service not configured' };
    }

    const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Staffdox Contact Form" <${emailUser}>`,
      to: emailUser,
      replyTo: contactData.email, // Allow admin to reply directly to the sender
      subject: `Contact Form: ${contactData.subject}`,
      html: getContactEmailTemplate(contactData),
      text: `New Contact Form Submission\n\nName: ${contactData.name}\nEmail: ${contactData.email}\nSubject: ${contactData.subject}\n\nMessage:\n${contactData.message}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent to admin:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact email:', error);
    return { success: false, error: error.message };
  }
};

// Send contact confirmation email to sender
const sendContactConfirmation = async (email, name) => {
  try {
    if (!process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured. Skipping contact confirmation email.');
      return { success: false, message: 'Email service not configured' };
    }

    const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Staffdox" <${emailUser}>`,
      to: email,
      subject: 'Thank You for Contacting Staffdox',
      html: getContactConfirmationTemplate(name),
      text: `Thank You for Contacting Us!\n\nHi ${name || 'there'},\n\nWe have received your message and appreciate you taking the time to reach out to us. Our team will review your inquiry and get back to you as soon as possible.\n\nWe typically respond within 24-48 hours during business days.\n\nThank you for choosing Staffdox!\n\nBest regards,\nThe Staffdox Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Sales enquiry thank you email template
const getSalesEnquiryThankYouTemplate = (contactName, companyName) => {
  const name = contactName || 'there';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Your Interest</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
            <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    <span style="display: inline-block; margin-right: 8px;">💼</span>
                    Staffdox
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                    Your Recruitment Partner
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                    Thank You for Reaching Out, ${name}! 🙏
                  </h2>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We have received your callback request and truly appreciate your interest in Staffdox's recruitment solutions for <strong>${companyName || 'your company'}</strong>.
                  </p>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Our team has been notified about your enquiry and will review your requirements. We'll get back to you shortly to discuss how we can help you find the best talent for your organization.
                  </p>
                  
                  <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: bold;">
                      📞 What Happens Next?
                    </p>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                      <li>Our sales team will review your requirements</li>
                      <li>We'll contact you within 24-48 hours</li>
                      <li>We'll discuss the best plan for your hiring needs</li>
                      <li>We'll help you get started with our platform</li>
                    </ul>
                  </div>
                  
                  <p style="margin: 30px 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    In the meantime, feel free to explore our platform and learn more about how Staffdox can help streamline your recruitment process.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/employer/login" 
                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Explore Employer Portal →
                    </a>
                  </div>
                  
                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    If you have any urgent questions, please don't hesitate to contact us at <a href="mailto:info@staffdox.co.in" style="color: #2563eb;">info@staffdox.co.in</a> or call us at <a href="tel:+919351060628" style="color: #2563eb;">+91 9351060628</a>.
                  </p>
                  
                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Best regards,<br>
                    <strong>The Staffdox Team</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} Staffdox. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Office No 4&5, Second Floor, NTC, Bhilwara, Rajasthan 311001
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Send sales enquiry thank you email
const sendSalesEnquiryThankYou = async (email, contactName, companyName) => {
  try {
    if (!process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured. Skipping sales enquiry thank you email.');
      return { success: false, message: 'Email service not configured' };
    }

    const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `Staffdox <${emailUser}>`,
      to: email,
      subject: 'Thank You for Your Interest in Staffdox - We\'ll Contact You Soon!',
      html: getSalesEnquiryThankYouTemplate(contactName, companyName),
      text: `Thank You for Reaching Out!\n\nHi ${contactName || 'there'},\n\nWe have received your callback request and truly appreciate your interest in Staffdox's recruitment solutions for ${companyName || 'your company'}.\n\nOur team has been notified about your enquiry and will review your requirements. We'll get back to you shortly to discuss how we can help you find the best talent for your organization.\n\nWhat Happens Next?\n- Our sales team will review your requirements\n- We'll contact you within 24-48 hours\n- We'll discuss the best plan for your hiring needs\n- We'll help you get started with our platform\n\nIf you have any urgent questions, please don't hesitate to contact us at info@staffdox.co.in or call us at +91 9351060628.\n\nBest regards,\nThe Staffdox Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Sales enquiry thank you email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending sales enquiry thank you email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendEmployerWelcomeEmail,
  sendSubscriptionConfirmation,
  sendJobNotificationToSubscribers,
  sendPasswordResetEmail,
  sendContactEmail,
  sendContactConfirmation,
  sendSalesEnquiryThankYou,
  createTransporter
};
