import "dotenv/config";
import { connectToDatabase } from "../src/config/db";
import { ContentModel } from "../src/models/Content";
import { env } from "../src/config/env";
import { UserModel } from "../src/models/User";

// Legal pages content extracted from frontend
const legalPagesContent = {
  "cookie-policy": {
    title: "Cookie Policy",
    content: `<p>Tassel and Wicker (hereinafter referred to as the "Company," or "we"), shall undertake to ensure the security of personal information and the protection of rights of the visitors of the website (hereinafter referred to as the "Visitors") while you use Tassel and Wickers website including but not limited to  www.tasselandwicker.com, (hereinafter referred to as the "Website") and the content of it.</p>

<p>First and foremost, we DO NOT sell your personal information. However, when you visit or interact with our sites, services, applications, tools or messaging, we or our authorized service providers may use cookies, web beacons, and other similar technologies to make your experience better, faster and safer, for advertising purposes and to allow us to continuously improve our sites, services, applications and tools.</p>

<h2>1. General Introduction About Cookies</h2>
<p>This Cookie Policy explains what cookies are, how we use them on our website www.tasselandwicker.com(the "Website"), and what your choices are regarding their use.</p>

<p>This policy should be read alongside our Privacy Policy which sets out how we process your personal data.</p>

<h2>2. What are Cookies?</h2>
<p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide reporting information.</p>

<p>Cookies can be:</p>
<ul>
<li><strong>Session Cookies:</strong> These are temporary and expire once you close your browser.</li>
<li><strong>Persistent Cookies:</strong> These remain on your device for a set period or until you delete them.</li>
</ul>

<p>Cookies can also be:</p>
<ul>
<li><strong>First-Party Cookies:</strong> Set directly by the Website you are visiting.</li>
<li><strong>Third-Party Cookies:</strong> Set by a different domain (a third party) than the one you are visiting, typically for advertising or analytics.</li>
</ul>

<h2>3. How We Use Cookies</h2>
<p>We can only store cookies on your device if they are strictly necessary for the operation of this Website or the provision of a service you have explicitly requested like maintaining your shopping cart.</p>

<p>For all other non-essential cookies like analytics, performance, and marketing cookies, we must obtain your prior, informed, and explicit consent before setting them.</p>

<h3>3.1 Category of Cookies:</h3>
<p>We use the following categories of cookies for the purposes detailed below. You have the right to choose which non-essential cookies we can use.</p>

<p><strong>Strictly Necessary Cookies</strong></p>
<p>Essential for the core functionality of the website like security, networking, accessibility, remembering items in a shopping basket. This type of cookie does not require consent.</p>

<p><strong>Performance/Analytics Cookies</strong></p>
<p>Allows us to count visits and traffic sources so we can measure and improve the performance of our site. Data is typically aggregated like Google Analytics.</p>

<p><strong>Functional/Preference Cookies</strong></p>
<p>Enables the website to provide enhanced functionality and personalisation like  remembering your language, region, or login details.</p>

<p><strong>Targeting/Advertising Cookies</strong></p>
<p>Set through our site by our advertising partners. They are used to build a profile of your interests and show you relevant adverts on other sites.</p>

<h3>3.2 Objectives, aims</h3>
<p>We use the cookies to:</p>
<ul>
<li>Ensure efficient and safe functioning of the Website; we use cookies to enable and support our security features, and to help us detect malicious activity on our Website;</li>
<li>Understand, improve, and research products, features, and services, including when you access our Website from other websites, applications, or devices such as your work computer or your mobile device;</li>
<li>Recognize the returning visitors of the Website; cookies help us show you the right information and personalize your experience; cookies also help avoiding re-registration or re-filling of the information by you each time you visit the Website;</li>
<li>Analyse your habits so that the functioning of the Website would be convenient, efficient and would conform to your needs and expectations, for example, by ensuring that the Visitors would, without difficulty, find everything they are looking for;</li>
<li>Measure the flows of the information and data being sent to our Website; we use the cookies for accumulation of statistical data about the number of users of the Website and their use of the Website;</li>
<li>Targeting and advertising; by using the cookies we may collect information so that only relevant content is displayed for the browser by creating different target groups; we may use cookies to show you relevant advertising both on and off our Website.</li>
</ul>

<p>We may, to the extent allowed by applicable laws, link the data, received from the cookies, with other information obtained about you from other legal sources (i.e., information about the use of the services, online account, etc.).</p>

<h3>3.3 Third Party Cookies Disclosure</h3>
<p>Our website includes content and functionality provided by third parties. When you interact with these services, the third-party provider may process your data using cookies or similar technologies. These providers include:</p>
<ul>
<li>Advertising & Marketing Partners</li>
<li>Payment Processors</li>
</ul>

<h2>4. Your Consent and How to Manage Cookies</h2>
<p>You have control over the use of non-essential cookies. When you first visit our Website, you will be presented with a clear consent tool (a cookie banner) that gives you the following options:</p>
<ul>
<li>"Accept All": To consent to all cookie categories.</li>
<li>"Reject All" (or "Block All"): To decline all non-essential cookies.</li>
<li>"Manage Preferences" (or "Customise"): To choose which specific categories you consent to (e.g., accepting analytics but rejecting marketing).</li>
</ul>

<h3>4.1 How to Change Your Preferences:</h3>
<p>To change your cookie preferences, please follow this link depending on your device and browser</p>

<p>Alternatively, most web browsers allow you to control cookies through their settings. You can usually find these settings in the 'options' or 'preferences' menu of your browser. For more information, you can visit the links below:</p>
<ul>
<li>Chrome Cookie Settings: https://policies.google.com/technologies/cookies?hl=en-US/</li>
<li>Firefox Cookie Setting: https://www.firefox.com/en-US/privacy/websites/cookie-settings/</li>
<li>Safari Cookie Setting: https://support.apple.com/en-ca/guide/safari/ibrw850f6c51/mac</li>
<li>Edge/IE Cookie Settings: https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64</li>
</ul>

<h2>5. Changes to this Cookie Policy</h2>
<p>We may update this policy from time to time to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies. This policy was last updated on November 19, 2025.</p>`,
  },
  "privacy-policy": {
    title: "Privacy Policy",
    content: `<p><strong>Effective Date: November 19, 2025</strong></p>

<p>At Tassel & Wicker (referred to as "we," "us," or "our"), we value your privacy and are committed to protecting your personal data. This Privacy Notice explains how we collect, use, and protect your personal data when you use our website, purchase items from the organisation, or interact with us.</p>

<p>We are committed to protecting your privacy and handling your personal data in an open and transparent manner. This Privacy Policy sets out how we collect, use, store, and share your personal data, and explains your rights under UK data protection law.</p>

<h2>1. Introduction</h2>
<p>Effective Date: November 19, 2025</p>

<p>At Tassel & Wicker (referred to as "we," "us," or "our"), we value your privacy and are committed to protecting your personal data. This Privacy Notice explains how we collect, use, and protect your personal data when you use our website, purchase items from the organisation, or interact with us.</p>

<p>We are committed to protecting your privacy and handling your personal data in an open and transparent manner. This Privacy Policy sets out how we collect, use, store, and share your personal data, and explains your rights under UK data protection law.</p>

<h2>2. Who We Are</h2>
<p>Business Name: Tassel & Wicker</p>

<p>Jurisdiction: United Kingdom</p>

<p>Type of Business: Retail business specialising in lifestyle products, home goods and gifts.</p>

<p>Contact Email for privacy: Info@tasselandwicker.com</p>

<p>For all privacy and data protection inquiries, or to exercise your data subject rights, please contact us directly at the email address provided above: info@tasselandwicker.com.</p>

<h2>3. Personal Data We Collect</h2>
<p>We collect and process the following categories of personal information:</p>
<ul>
<li><strong>Identifiers:</strong> Names, Email addresses, Phone numbers, Addresses, Photos, ID or passport information</li>
<li><strong>Commercial Information:</strong> Payment Details, Location data.</li>
<li><strong>Internet Activity Information:</strong> Website activity or cookies.</li>
</ul>

<p>Personal information is anything that directly or indirectly identifies and relates to a living person, such as a name, address, telephone number, date of birth, unique identification number, photographs, video recordings. WE DO NOT COLLECT video recordings.</p>

<p>Some personal information is 'special category data' and needs more protection due to its sensitivity. This includes any information about an identifiable individual that can reveal their sexuality and sexual health, religious or philosophical beliefs, racial origin, ethnicity, physical or mental health, trade union membership, political opinion, genetic/biometric data. Personal information relating to criminal offences and convictions, although not 'special category data', is still sensitive in nature and merits higher protection.</p>

<p>We do not collect Health information or Employment details.</p>

<h2>4. How We Collect Your Data</h2>
<p>We collect data through the following methods:</p>
<ul>
<li>Website forms when you populate them.</li>
<li>Sign-up sheets</li>
<li>Newsletter Subscription forms</li>
<li>Cookies</li>
<li>Social media interactions</li>
</ul>

<h2>5. Why We Collect and Use Your Data (Our Lawful Basis)</h2>
<p>We collect your personal data for the following purposes, based on the identified lawful basis:</p>

<h2>6. Sharing Your Personal Data</h2>
<p>We share your personal data with third-party service providers and partners to operate our business effectively. We will only share data necessary for them to perform their services.</p>

<p>Examples of parties we share data with:</p>
<ul>
<li><strong>Newsletter/Marketing Providers:</strong> Email addresses shared with services to send you marketing communications.</li>
<li><strong>Financial Services Providers:</strong> Payment Details shared with services to process your payments.</li>
<li><strong>Other Service Providers:</strong> As needed depending on the context, which may include logistics partners, IT service providers, etc.</li>
</ul>

<p>We take steps to ensure all third parties are compliant with UK General Data Protection Regulation(GDPR).</p>

<h2>7. Data Storage and Security</h2>
<p><strong>Storage Locations:</strong> We store data on company computers, on our website database, and in the cloud (iCloud).</p>

<p><strong>Security Measures:</strong> We use the following measures to protect your data:</p>
<ul>
<li><strong>Passwords:</strong> Data is stored in locations accessible only with a password.</li>
<li><strong>Encryption:</strong> We use methods such as hashing, pseudonymisation, and anonymization to encrypt data.</li>
<li><strong>Access Controls:</strong> Security measures ensure only authorised individuals can access personal data, systems, or files when required.</li>
</ul>

<h2>8. International Data Transfers</h2>
<p>Some of our third-party service providers may host data outside the UK. Where this is the case, we will ensure appropriate safeguards such as Standard Contractual Clauses are in place to ensure your personal data is protected to the same standard as in the UK.</p>

<p>We share your personal data with certain service providers who are based outside the UK and the European Economic Area (EEA). This is necessary to facilitate our business operations, such as:</p>
<ul>
<li>Using cloud hosting services (for website and data storage).</li>
<li>Utilising specific software platforms like email marketing, customer relationship management.</li>
</ul>

<p>When we transfer your personal data outside the UK, we ensure a similar degree of protection is afforded to it by ensuring at least one of the following safeguards is implemented:</p>

<ol>
<li><strong>Adequacy Decisions</strong><br>
We may transfer your data to countries that have been deemed to provide an adequate level of protection for personal data by the UK government.</li>

<li><strong>Appropriate Safeguards (Contractual Clauses)</strong><br>
Where an adequacy decision does not exist, we will use appropriate safeguards, which include implementing:
<ul>
<li>The International Data Transfer Agreement (IDTA) issued by the UK Information Commissioner's Office (ICO); OR</li>
<li>The International Data Transfer Addendum to the European Commission's Standard Contractual Clauses (SCCs).</li>
</ul>
These contractual documents provide specific obligations on the recipient of the data to protect your personal data to the standard required by UK data protection law.</li>

<li><strong>Necessity/Derogations:</strong><br>
In the absence of an adequacy decision or appropriate safeguards, we may rely on a specific derogation for the transfer such as where the transfer is necessary for the performance of a contract between you and us, or you have given explicit consent to the proposed transfer after being informed of the risks. This is typically only for one-off or non-systematic transfers.</li>
</ol>

<h2>9. Your Data Protection Rights</h2>
<p>Under UK data protection law, you have the following rights, which you can exercise by contacting us at Info@tasselandwicker.com</p>
<ul>
<li><strong>Right to Opt-out of Marketing:</strong> You can always opt out of marketing by following the unsubscribe link provided in our marketing emails.</li>
<li><strong>Right to Access (Subject Access Request):</strong> You have the right to ask for a copy of the personal data we hold about you.</li>
<li><strong>Right to Rectification:</strong> You have the right to ask us to correct data that you believe is inaccurate or incomplete.</li>
<li><strong>Right to Erasure ('Right to be Forgotten'):</strong> You have the right to ask us to delete your personal data.</li>
</ul>

<p>If you wish to exercise your rights (Access, Correction, Deletion), please contact us via info@tasselandwicker.com, and we will process your request manually.</p>

<h2>10. Data Retention and Disposal</h2>
<p>We will only keep your personal data for as long as necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.</p>

<p>To determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we process your personal data, and any applicable legal requirements.</p>

<p>We adhere to the following standard retention periods:</p>
<ul>
<li><strong>Financial & Tax Records:</strong> We generally retain financial transaction data (including payment details and associated customer information) for six years after the end of the relevant tax year, to comply with legal obligations set by His Majesty's Revenue and Customs (HMRC).</li>
<li><strong>Customer Order History:</strong> This data is retained for a period of up to one year after the last purchase to cover potential contractual claims, manage warranty issues, and provide customer support.</li>
<li><strong>Marketing Consent (Email List):</strong> We retain your email address until you unsubscribe.</li>
</ul>

<h2>11. Disposal Methods</h2>
<p>When data is no longer needed, we will safely dispose of it by:</p>

<p><strong>Digital Data (Website/Computers/iCloud):</strong> We use methods such as secure deletion (wiping) software to ensure data is permanently removed and cannot be recovered. Where data is highly sensitive, we may use anonymisation to retain statistical information without identifying you.</p>

<h2>12. Website Cookies and Tracking</h2>
<p>We use tracking tools and cookies on our website such as:</p>

<h2>13. Data Breach Procedure</h2>
<p>A personal data breach is a security incident that leads to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data transmitted, stored, or otherwise processed.</p>

<p>We have a procedure in place to deal with any suspected personal data breach and will follow these steps:</p>
<ul>
<li><strong>Containment & Assessment:</strong> We will immediately take steps to contain the breach and assess the risk level and the extent of the data compromised.</li>
<li><strong>Notification to the ICO:</strong> If the breach is likely to result in a risk to the rights and freedoms of individuals, we will report the breach to the Information Commissioner's Office (ICO) in the UK within 72 hours of becoming aware of it.</li>
<li><strong>Notification to Affected Individuals:</strong> If the breach is likely to result in a high risk to the rights and freedoms of individuals like identity theft, or financial loss, we will inform the affected individuals directly and without undue delay, advising them on the steps they can take to protect themselves.</li>
<li><strong>Investigation & Remediation:</strong> We will investigate the cause of the breach and take measures to prevent any reoccurrence like enhancing security protocols, or  providing extra staff training.</li>
<li><strong>Documentation:</strong> We will keep a detailed record of all personal data breaches, regardless of whether we are required to notify the ICO or the individuals.</li>
</ul>`,
  },
  "terms-of-service": {
    title: "Terms of Service",
    content: `<h2>Who we are</h2>
<p>We are tasselandwicker.com an online lifestyle brand.</p>

<h2>Introduction</h2>
<p>These Terms and Conditions ("Terms") govern your use of the website located at, www.tasselandwicker.com (the "Website"), which is operated by Tassel and Wicker (the "Company", "we", "us", or "our"). By accessing or using the Website, you agree to be bound by these Terms, which constitute a legally binding agreement between you and the Company. If you disagree with any part of the Terms, you must not use the Website.</p>

<h2>Using Tasselandwicker.com</h2>
<p>You agree to use tasselandwicker.com  only for lawful purposes. You must also use it in a way that does not infringe the rights of, or restrict or inhibit the use and enjoyment of, this site by anyone else.</p>

<p>We update tasselandwicker.com all the time. We can change or remove content at any time without notice.</p>

<h2>Changes to the Terms</h2>
<p>We reserve the right to revise and amend these Terms from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.</p>

<p>You are responsible for regularly reviewing these Terms. Your continued use of the Website after any changes are posted constitutes your acceptance of the new Terms.</p>

<h2>Intellectual Property Rights</h2>
<p>Unless otherwise stated, we or our licensors own the intellectual property rights in the Website and material on the Website, including but not limited to all content, text, graphics, logos, images, audio, video, software, and underlying code.</p>

<p>All these intellectual property rights are reserved. You may view, download for caching purposes only, and print pages from the Website for your own personal use, subject to the restrictions set out below and elsewhere in these Terms.</p>

<h2>Acceptable Use</h2>
<p>You must not:</p>
<ul>
<li>Republish material from this Website (including republication on another website).</li>
<li>Sell, rent, or sub-license material from the Website.</li>
<li>Show any material from the Website in public.</li>
<li>Reproduce, duplicate, copy, or otherwise exploit material on our Website for a commercial purpose.</li>
<li>Redistribute material from this Website.</li>
<li>Use our Website in any way that causes, or may cause, damage to the Website or impairment of the availability or accessibility of the Website.</li>
<li>Use our Website in any way which is unlawful, illegal, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</li>
</ul>

<h2>User Accounts and Registration</h2>
<p>If any part of the Website requires you to register an account, you agree to provide accurate and complete information and to keep this information up-to-date.</p>

<p>You are responsible for maintaining the confidentiality of your account password and are responsible for all activities that occur under your account.</p>

<p>We reserve the right to terminate or suspend your account at any time for any breach of these Terms.</p>

<h2>Information about you and your visits to tasselandwicker.com</h2>
<p>We collect information about you in accordance with our privacy policy and our cookie policy. By using tasselandwicker.com, you agree to us collecting this information and confirm that any data you provide is accurate.</p>

<h2>Limitation of Liability</h2>
<p>Nothing in these Terms will:</p>
<p>(a) limit or exclude our or your liability for death or personal injury resulting from negligence;</p>

<p>(b) limit or exclude our or your liability for fraud or fraudulent misrepresentation;</p>

<p>(c) limit any of our or your liabilities in any way that is not permitted under applicable UK law;</p>

<p>or</p>

<p>(d) exclude any of our or your liabilities that may not be excluded under applicable UK law.</p>

<p>Subject to the preceding paragraph, the Website and its content are provided on an "as is" and "as available" basis. To the extent permitted by law, we exclude all warranties, representations, conditions, and other terms which might otherwise be implied by statute, common law, or the law of equity.</p>

<p>We will not be liable for any loss or damage of any nature, including direct, indirect, or consequential loss, arising under or in connection with the use of, or inability to use, the Website.</p>

<h2>Indemnity</h2>
<p>You hereby indemnify us and undertake to keep us indemnified against any losses, damages, costs, liabilities, and expenses (including, without limitation, legal expenses and any amounts paid by us to a third party in settlement of a claim or dispute on the advice of our legal advisers) incurred or suffered by us arising out of any breach by you of any provision of these terms.</p>

<h2>Governing Law and Jurisdiction</h2>
<p>These Terms shall be governed by and construed in accordance with the laws of England and Wales.</p>

<p>Any disputes relating to these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

<h2>Contact Information</h2>
<p>If you have any questions about these Terms, please contact us at:</p>

<p>Email: info@tasselandwicker.com</p>`,
  },
  returns: {
    title: "Returns & Exchanges",
    content: `<p>Due to the nature of our small-batch collections and the attention that goes into each order, we currently do not offer returns once a purchase has been made.</p>

<p>That said, we understand that life happens and that receiving your parcel in excellent condition matters. If your order arrives and there's an issue with the condition of the item(s), please reach out to us within 7 days of delivery. We'll be happy to assist with an exchange or resolution if the product is returned in its original, unused condition and packaging.</p>

<p>To begin an exchange or to share any concerns, kindly contact us at <a href="mailto:info@tasselandwicker.com">info@tasselandwicker.com</a> with your order number and a brief note about your situation. Our team will guide you through the next steps with care.</p>

<p>We deeply value your trust in Tassel & Wicker and appreciate your understanding as we uphold the integrity and craftsmanship behind each item we send out.</p>`,
  },
  shipping: {
    title: "Shipping Information",
    content: `<p>At Tassel & Wicker, every order is prepared with care and attention. From the moment your baskets are wrapped to the moment they arrive at your home, we want the experience to feel considered.</p>

<h2>PROCESSING TIME</h2>
<p>Please allow 1 - 2 business days for processing before your parcel begins its journey. During busy seasons or for custom items, processing may take a little longer.</p>

<h2>SHIPPING OPTIONS</h2>
<p>We currently offer standard shipping across the United Kingdom. Shipping costs are calculated at checkout based on your location and order size.</p>

<h2>DELIVERY TIMELINE</h2>
<p>Once dispatched, standard delivery typically arrives within 2-3 business days, depending on your location.</p>

<h2>ORDER TRACKING</h2>
<p>When your order is on its way, you will receive a confirmation email with tracking details so you can follow its journey home to you.</p>

<h2>INTERNATIONAL SHIPPING</h2>
<p>We provide international shipping to most countries around the world. Please be aware that customs fees or import duties may apply based on your location. Shipping options and delivery estimates will be shown at checkout and full tracking will be provided once your order is dispatched.</p>

<h2>QUESTIONS OR SPECIAL REQUEST</h2>
<p>If you have a special request, a note to include, or any questions about your delivery, we'd love to hear from you. You can reach out to us at info@tasselandwicker.com.</p>`,
  },
};

// About page content (structured JSON with images)
const aboutPageContent = {
  // Hero section
  heroImage: "/images/headers/about-header-alt.jpg",

  // My Why section
  myWhyTitle: "MY WHY",
  myWhyText1:
    "Tassel & Wicker was created from a love for the little things that make life feel elevated and intentional. Think soft woven throw blankets, polished crystals, marble coasters, tin cookies, incense cones, tassel key chains, linen notepads, duck feather cushions…little tokens of comfort that slow us down, center us and help transform an ordinary space into a sanctuary of calm and creativity.",
  myWhyText2:
    "My vision is for Tassel & Wicker to stand as a symbol of thoughtfulness; a reminder to celebrate everyday moments and surround ourselves with quality pieces that bring joy and meaning. Through every product and experience, I hope to inspire a way of living that feels elevated, joyful and deeply considered.",
  myWhyImage: "/images/about/my-why.jpg",

  // Our Story section
  ourStoryTitle: "OUR STORY",
  ourStoryText1:
    "Our story starts with a collection of signature celebration baskets, the first step toward our envisioned line of home and lifestyle pieces. Through our celebration baskets, I invite you to reimagine how you express appreciation; not as a routine gesture, but as a chance to connect, honor individuality and create beautiful memories.",
  ourStoryText2:
    "Here's to celebrating the little things and moments that make life feel special.",
  ourStoryImage: "/images/about/stacked-baskets.jpg",

  // Signature section
  signature: "Dee",
  signatureTitle: "Founder, Tassel & Wicker",

  // Built For section (videos carousel)
  builtForTitle: "IT'S THE THOUGHT GIFT THAT COUNTS",
  builtForVideos: [
    "/videos/VIDEO 1.mp4",
    "/videos/VIDEO 2.mp4",
    "/videos/VIDEO 3.mp4",
    "/videos/VIDEO 4.mp4",
  ],
};

async function main() {
  // Ensure env is loaded/validated
  void env;
  await connectToDatabase();

  // Get admin user for updatedBy field
  const adminUser = await UserModel.findOne({ role: "admin" });
  const adminUserId = adminUser?.id || "system";

  // Clear existing content
  await ContentModel.deleteMany({});

  // Seed legal pages
  for (const [page, data] of Object.entries(legalPagesContent)) {
    await ContentModel.create({
      id: page,
      page: page as any,
      title: data.title,
      content: data.content,
      documentUrl: null,
      updatedBy: adminUserId,
    });
    console.log(`[seed] Created content for: ${data.title}`);
  }

  // Seed about page
  await ContentModel.create({
    id: "about",
    page: "about",
    title: "About Page",
    content: JSON.stringify(aboutPageContent),
    documentUrl: null,
    updatedBy: adminUserId,
  });
  console.log(`[seed] Created content for: About Page`);

  const total = await ContentModel.countDocuments();
  console.log(`[seed] done. content pages in db: ${total}`);
}

main().catch((e) => {
  console.error("[seed-content] failed", e);
  process.exit(1);
});

