import React, { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">StaffDox LLP – Privacy Policy</h1>
      <div className="bg-white rounded-lg shadow-sm p-8 space-y-8 text-gray-700">
        <section>
          <p className="mb-4">
            StaffDox LLP ("we", "our", "us") is committed to protecting the privacy of candidates, clients, website visitors, and all users of our services. This Privacy Policy explains how we collect, store, use, and disclose your personal information when you interact with us.
          </p>
          <p>
            By accessing our Website, submitting your information, creating an account, or using our services, you agree to the practices described in this Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We may collect the following types of personal information:</p>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">A. Candidate Information</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Full name</li>
            <li>Email address, phone number, and contact details</li>
            <li>Resume/CV</li>
            <li>Work history and professional experience</li>
            <li>Skills, qualifications, certifications</li>
            <li>Identification documents (if required by clients)</li>
            <li>Job preferences and expectations</li>
            <li>References provided by you</li>
            <li>Any other info you provide voluntarily</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">B. Client Information</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Contact person name</li>
            <li>Company name and details</li>
            <li>Official email address and phone number</li>
            <li>Job requirements</li>
            <li>Hiring preferences & feedback</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">C. Website User Information</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>IP address</li>
            <li>Browsing data</li>
            <li>Device and browser details</li>
            <li>Cookies and analytics data</li>
            <li>Contact form submissions</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">D. Sensitive Information (Only if necessary)</h3>
          <p>
            We may collect limited sensitive data such as ID proof, address proof, or compliance documents only for recruitment or verification purposes, and only with your explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use your personal data for purposes including:</p>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">For Candidates</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Matching your profile with suitable job opportunities</li>
            <li>Sharing your CV and details with clients (only with your consent)</li>
            <li>Scheduling interviews and communication</li>
            <li>Providing recruitment updates</li>
            <li>Improving our candidate services</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">For Clients</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Understanding hiring requirements</li>
            <li>Providing candidate profiles</li>
            <li>Managing recruitment communication</li>
            <li>Improving client service quality</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">For Website Users</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Improving website performance</li>
            <li>Security and fraud prevention</li>
            <li>Responding to inquiries</li>
            <li>Analytics and user experience enhancement</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">Marketing</h3>
          <p className="mb-2">
            We may send updates, newsletters, job alerts, and service-related communications.
          </p>
          <p>
            You may unsubscribe anytime.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Sharing Your Information</h2>
          <p className="mb-4">We may share your information with:</p>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">A. Employers / Clients</h3>
          <p className="mb-4">
            With your consent, we share candidate details for relevant job opportunities.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">B. Third-Party Service Providers</h3>
          <p className="mb-2">Such as:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Background verification partners</li>
            <li>IT support companies</li>
            <li>Cloud storage providers</li>
            <li>Communication tools</li>
          </ul>
          <p className="mb-4">
            These vendors follow strict confidentiality obligations.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">C. Legal Authorities</h3>
          <p className="mb-4">
            If required by law, court order, or regulatory rules.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">D. Internal StaffDox Consultants</h3>
          <p className="mb-4">
            For recruitment, staffing, and operational purposes.
          </p>

          <p className="font-semibold">
            We do NOT sell your personal data to any third party under any circumstances.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. International Data Transfers</h2>
          <p>
            If your information is shared with employers or partners outside India, we will ensure appropriate data protection safeguards are in place.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How We Protect Your Information</h2>
          <p className="mb-4">We implement reasonable technical and organizational measures including:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Encrypted storage</li>
            <li>Restricted access controls</li>
            <li>Secure database systems</li>
            <li>Strong password protection</li>
            <li>Regular system checks</li>
          </ul>
          <p>
            However, no online transmission is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
          <p className="mb-4">Depending on applicable law, you may request:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Access to your personal information</li>
            <li>Correction of inaccurate data</li>
            <li>Deletion of your data (where legally permissible)</li>
            <li>Restriction of processing</li>
            <li>Withdrawal of consent</li>
            <li>Stopping marketing communication</li>
          </ul>
          <p className="mb-2">
            You can make requests by contacting us at <a href="mailto:info@staffdox.co.in" className="text-blue-600 hover:underline">info@staffdox.co.in</a>.
          </p>
          <p>
            We may need to verify your identity before processing your request.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
          <p className="mb-4">We retain personal information only for as long as necessary:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Candidate data:</strong> until job search process is active or as required by law</li>
            <li><strong>Client data:</strong> for the duration of the business relationship</li>
            <li><strong>Website data:</strong> for analytics and security purposes</li>
          </ul>
          <p>
            You may request deletion of your data anytime, subject to legal exceptions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies & Tracking Technologies</h2>
          <p className="mb-4">Our Website may use cookies to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Improve user experience</li>
            <li>Remember preferences</li>
            <li>Track usage patterns</li>
            <li>Analyze website performance</li>
          </ul>
          <p className="mb-2">
            You can disable cookies in your browser settings, but doing so may limit functionality.
          </p>
          <p>
            A separate Cookies Policy can be provided upon request.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Links to Third-Party Websites</h2>
          <p className="mb-4">Our Website may link to external sites. We are not responsible for their:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Privacy practices</li>
            <li>Security</li>
            <li>Content</li>
            <li>Data handling</li>
          </ul>
          <p>
            We encourage you to review their privacy policies before sharing any information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
          <p className="mb-2">
            We may update this policy periodically.
          </p>
          <p>
            Changes will be posted on this page with an updated "Latest Update" date. Continued use of our Website or services after updates indicates acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
          <p className="mb-4">
            If you have questions, concerns, or requests regarding this Privacy Policy, contact:
          </p>
          <div className="bg-gray-50 rounded-lg p-6 space-y-2">
            <p className="font-semibold text-gray-900">StaffDox LLP</p>
            <p>Office No. 4 & 5, Second Floor, NTC</p>
            <p>Bhilwara, Rajasthan – 311001</p>
            <p>
              Email: <a href="mailto:info@staffdox.co.in" className="text-blue-600 hover:underline">info@staffdox.co.in</a>
            </p>
            <p>
              Phone: <a href="tel:+919351060628" className="text-blue-600 hover:underline">+91 9351060628</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

