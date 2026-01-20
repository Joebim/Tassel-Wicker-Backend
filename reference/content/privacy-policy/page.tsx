'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { LuChevronDown } from 'react-icons/lu';
import ScrollTextAnimation from '@/components/common/ScrollTextAnimation';
import CircularText from '@/components/common/CircularText';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import DocumentViewerLink from '@/components/common/DocumentViewer';
import { useContent } from '@/hooks/useContent';

export default function PrivacyPolicy() {
    const { data: contentData, isLoading } = useContent('privacy-policy');

    // Parse content
    const pageContent = (() => {
        const defaultContent = {
            headerImage: '/images/headers/privacy-policy-header.jpg',
            title1: 'PRIVACY',
            title2: 'POLICY',
            body: ''
        };

        if (contentData?.content) {
            try {
                const parsed = JSON.parse(contentData.content);
                // Check if it's our new structured format
                if (typeof parsed === 'object' && parsed !== null) {
                    return {
                        headerImage: parsed.headerImage || defaultContent.headerImage,
                        title1: parsed.title1 || defaultContent.title1,
                        title2: parsed.title2 || defaultContent.title2,
                        body: parsed.body || contentData.content // fallback to raw if body missing but valid json? unlikely but safe
                    };
                }
            } catch {
                // Not JSON, treat as body content
                return {
                    ...defaultContent,
                    body: contentData.content
                };
            }
        }
        return defaultContent;
    })();

    const documentUrl = contentData?.documentUrl || null;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
    }, []);

    // Fallback sections if API fails
    const sections = [
        {
            title: '1. Introduction',
            content:
                'Effective Date: November 19, 2025\n\nAt Tassel & Wicker (referred to as "we," "us," or "our"), we value your privacy and are committed to protecting your personal data. This Privacy Notice explains how we collect, use, and protect your personal data when you use our website, purchase items from the organisation, or interact with us.\n\nWe are committed to protecting your privacy and handling your personal data in an open and transparent manner. This Privacy Policy sets out how we collect, use, store, and share your personal data, and explains your rights under UK data protection law.',
        },
        {
            title: '2. Who We Are',
            content:
                'Business Name: Tassel & Wicker\n\nJurisdiction: United Kingdom\n\nType of Business: Retail business specialising in lifestyle products, home goods and gifts.\n\nContact Email for privacy: Info@tasselandwicker.com\n\nFor all privacy and data protection inquiries, or to exercise your data subject rights, please contact us directly at the email address provided above: info@tasselandwicker.com.',
        },
        {
            title: '3. Personal Data We Collect',
            content:
                'We collect and process the following categories of personal information:\n\nIdentifiers: Names, Email addresses, Phone numbers, Addresses, Photos, ID or passport information\n\nCommercial Information: Payment Details, Location data.\n\nInternet Activity Information: Website activity or cookies.\n\nPersonal information is anything that directly or indirectly identifies and relates to a living person, such as a name, address, telephone number, date of birth, unique identification number, photographs, video recordings. WE DO NOT COLLECT video recordings.\n\nSome personal information is \'special category data\' and needs more protection due to its sensitivity. This includes any information about an identifiable individual that can reveal their sexuality and sexual health, religious or philosophical beliefs, racial origin, ethnicity, physical or mental health, trade union membership, political opinion, genetic/biometric data. Personal information relating to criminal offences and convictions, although not \'special category data\', is still sensitive in nature and merits higher protection.\n\nWe do not collect Health information or Employment details.',
        },
        {
            title: '4. How We Collect Your Data',
            content:
                'We collect data through the following methods:\n\n• Website forms when you populate them.\n• Sign-up sheets\n• Newsletter Subscription forms\n• Cookies\n• Social media interactions',
        },
        {
            title: '5. Why We Collect and Use Your Data (Our Lawful Basis)',
            content:
                'We collect your personal data for the following purposes, based on the identified lawful basis:',
            hasTable: true,
            tableData: [
                { purpose: 'To provide a product or service', basis: 'Performance of a contract with you' },
                { purpose: 'To process payments or invoices', basis: 'Performance of a contract with you' },
                { purpose: 'To contact customers or respond to enquiries', basis: 'Legitimate Interests (responding to customer requests)' },
                { purpose: 'To send marketing or newsletters', basis: 'Consent (where required) or Legitimate Interests (for existing customers)' },
                { purpose: 'To improve our website or services', basis: 'Legitimate Interests (improving customer experience)' },
                { purpose: 'To meet legal or tax requirements', basis: 'Compliance with a legal obligation' },
                { purpose: 'To recruit staff or volunteers', basis: 'Legitimate Interests or Pre-contractual steps.' },
            ],
        },
        {
            title: '6. Sharing Your Personal Data',
            content:
                'We share your personal data with third-party service providers and partners to operate our business effectively. We will only share data necessary for them to perform their services.\n\nExamples of parties we share data with:\n\nNewsletter/Marketing Providers: Email addresses shared with services to send you marketing communications.\n\nFinancial Services Providers: Payment Details shared with services to process your payments.\n\nOther Service Providers: As needed depending on the context, which may include logistics partners, IT service providers, etc.\n\nWe take steps to ensure all third parties are compliant with UK General Data Protection Regulation(GDPR).',
        },
        {
            title: '7. Data Storage and Security',
            content:
                'Storage Locations: We store data on company computers, on our website database, and in the cloud (iCloud).\n\nSecurity Measures: We use the following measures to protect your data:\n\nPasswords: Data is stored in locations accessible only with a password.\n\nEncryption: We use methods such as hashing, pseudonymisation, and anonymization to encrypt data.\n\nAccess Controls: Security measures ensure only authorised individuals can access personal data, systems, or files when required.',
        },
        {
            title: '8. International Data Transfers',
            content:
                'Some of our third-party service providers may host data outside the UK. Where this is the case, we will ensure appropriate safeguards such as Standard Contractual Clauses are in place to ensure your personal data is protected to the same standard as in the UK.\n\nWe share your personal data with certain service providers who are based outside the UK and the European Economic Area (EEA). This is necessary to facilitate our business operations, such as:\n\n• Using cloud hosting services (for website and data storage).\n• Utilising specific software platforms like email marketing, customer relationship management.\n\nWhen we transfer your personal data outside the UK, we ensure a similar degree of protection is afforded to it by ensuring at least one of the following safeguards is implemented:\n\n1. Adequacy Decisions\n\nWe may transfer your data to countries that have been deemed to provide an adequate level of protection for personal data by the UK government.\n\n2. Appropriate Safeguards (Contractual Clauses)\n\nWhere an adequacy decision does not exist, we will use appropriate safeguards, which include implementing:\n\nThe International Data Transfer Agreement (IDTA) issued by the UK Information Commissioner\'s Office (ICO); OR\n\nThe International Data Transfer Addendum to the European Commission\'s Standard Contractual Clauses (SCCs).\n\nThese contractual documents provide specific obligations on the recipient of the data to protect your personal data to the standard required by UK data protection law.\n\n3. Necessity/Derogations:\n\nIn the absence of an adequacy decision or appropriate safeguards, we may rely on a specific derogation for the transfer such as where the transfer is necessary for the performance of a contract between you and us, or you have given explicit consent to the proposed transfer after being informed of the risks. This is typically only for one-off or non-systematic transfers.',
        },
        {
            title: '9. Your Data Protection Rights',
            content:
                'Under UK data protection law, you have the following rights, which you can exercise by contacting us at Info@tasselandwicker.com\n\nRight to Opt-out of Marketing: You can always opt out of marketing by following the unsubscribe link provided in our marketing emails.\n\nRight to Access (Subject Access Request): You have the right to ask for a copy of the personal data we hold about you.\n\nRight to Rectification: You have the right to ask us to correct data that you believe is inaccurate or incomplete.\n\nRight to Erasure (\'Right to be Forgotten\'): You have the right to ask us to delete your personal data.\n\nIf you wish to exercise your rights (Access, Correction, Deletion), please contact us via info@tasselandwicker.com, and we will process your request manually.',
        },
        {
            title: '10. Data Retention and Disposal',
            content:
                'We will only keep your personal data for as long as necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.\n\nTo determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we process your personal data, and any applicable legal requirements.\n\nWe adhere to the following standard retention periods:\n\nFinancial & Tax Records: We generally retain financial transaction data (including payment details and associated customer information) for six years after the end of the relevant tax year, to comply with legal obligations set by His Majesty\'s Revenue and Customs (HMRC).\n\nCustomer Order History: This data is retained for a period of up to one year after the last purchase to cover potential contractual claims, manage warranty issues, and provide customer support.\n\nMarketing Consent (Email List): We retain your email address until you unsubscribe.',
        },
        {
            title: '11. Disposal Methods',
            content:
                'When data is no longer needed, we will safely dispose of it by:\n\nDigital Data (Website/Computers/iCloud): We use methods such as secure deletion (wiping) software to ensure data is permanently removed and cannot be recovered. Where data is highly sensitive, we may use anonymisation to retain statistical information without identifying you.',
        },
        {
            title: '12. Website Cookies and Tracking',
            content:
                'We use tracking tools and cookies on our website such as:',
            hasTable: true,
            tableData: [
                { cookieName: '_stripe_mid', provider: 'Stripe', purpose: 'Used for fraud prevention and distinguishing users during payment. Helps Stripe identify the device for secure checkout.', type: 'Third party(Strict)', expiry: '1 year', category: 'Strictly Necessary' },
                { cookieName: '__vercel_toolbar', provider: 'Vercel', purpose: 'Enables the Vercel developer toolbar in preview environments. Not used for tracking.', type: 'First-party', expiry: '17 days', category: 'Functional/Performance' },
                { cookieName: 'auth-storage', provider: 'This Website(Next.js + Firebase Auth)', purpose: 'Stores encoded authentication/session data for logged-in users', type: 'First-Party', expiry: '128', category: 'Strictly Necessary' },
                { cookieName: 'cookieConsent', provider: 'This Website', purpose: 'Stores whether the user accepted the cookie banner', type: 'First-Party', expiry: '21 days', category: 'Preferences' },
            ],
        },
        {
            title: '13. Data Breach Procedure',
            content:
                'A personal data breach is a security incident that leads to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data transmitted, stored, or otherwise processed.\n\nWe have a procedure in place to deal with any suspected personal data breach and will follow these steps:\n\nContainment & Assessment: We will immediately take steps to contain the breach and assess the risk level and the extent of the data compromised.\n\nNotification to the ICO: If the breach is likely to result in a risk to the rights and freedoms of individuals, we will report the breach to the Information Commissioner\'s Office (ICO) in the UK within 72 hours of becoming aware of it.\n\nNotification to Affected Individuals: If the breach is likely to result in a high risk to the rights and freedoms of individuals like identity theft, or financial loss, we will inform the affected individuals directly and without undue delay, advising them on the steps they can take to protect themselves.\n\nInvestigation & Remediation: We will investigate the cause of the breach and take measures to prevent any reoccurrence like enhancing security protocols, or  providing extra staff training.\n\nDocumentation: We will keep a detailed record of all personal data breaches, regardless of whether we are required to notify the ICO or the individuals.',
        },
    ];

    return (
        <div className="min-h-screen bg-white text-luxury-black">
            {/* Hero */}
            <section className="relative h-screen w-full overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={pageContent.headerImage}
                        alt="Privacy Policy"
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src && !target.src.includes('retry')) {
                                setTimeout(() => {
                                    target.src = `${target.src}${target.src.includes('?') ? '&' : '?'}retry=${Date.now()}`;
                                }, 1000);
                            }
                        }}
                    />
                    <div className="absolute inset-0 bg-black opacity-40" />
                </div>
                <div className="relative z-10 h-full w-full p-6 sm:p-10 lg:p-12 flex flex-row items-end sm:items-start justify-end lg:flex-row lg:items-end lg:justify-between gap-10">
                    <div className="w-full flex flex-row items-end justify-between self-end">
                        <div className="flex flex-col text-white max-w-3xl text-left">
                            <ScrollTextAnimation
                                className="text-[39px] sm:text-5xl lg:text-[110px] font-extralight tracking-wide uppercase leading-none"
                                delay={0.2}
                                duration={1.2}
                            >
                                {pageContent.title1}
                            </ScrollTextAnimation>
                            <ScrollTextAnimation
                                className="text-[39px] sm:text-5xl lg:text-[110px] font-extralight tracking-wide uppercase leading-none"
                                delay={0.2}
                                duration={1.2}
                            >
                                {pageContent.title2}
                            </ScrollTextAnimation>
                        </div>
                        <div className="relative flex justify-center lg:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        document.getElementById('privacy-content')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                                className="relative"
                                aria-label="Learn More"
                            >
                                <CircularText
                                    text="LEARN MORE • LEARN MORE • LEARN MORE • "
                                    spinDuration={15}
                                    onHover="speedUp"
                                    className="w-[70px] h-[70px] text-[11px] leading-0.5 sm:w-[120px] sm:h-[120px] sm:text-[12px]"
                                />
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <LuChevronDown size={24} className="cursor-pointer text-white animate-bounce" aria-hidden="true" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section id="privacy-content" className="py-16">
                <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-luxury-black font-extralight">Loading...</p>
                        </div>
                    ) : (
                        <>
                            {documentUrl && (
                                <DocumentViewerLink title="Privacy Policy Document" pageSlug="privacy-policy" />
                            )}
                            {pageContent.body ? (
                                <RichTextRenderer content={pageContent.body} />
                            ) : (
                                // Fallback to original content structure if API fails
                                <div className="prose prose-lg max-w-none text-luxury-black leading-relaxed space-y-8">
                                    {sections.map((section) => (
                                        <div key={section.title} className="mb-8">
                                            <h2 className="text-xl font-extralight uppercase text-luxury-black mb-4 mt-8">
                                                {section.title}
                                            </h2>
                                            <div className="text-base text-luxury-black font-extralight leading-relaxed whitespace-pre-line mb-6">
                                                {section.content}
                                            </div>
                                            {section.hasTable && section.tableData && (
                                                <div className="mt-6 mb-8 overflow-x-auto">
                                                    <table className="w-full border-collapse border border-gray-300 mt-4 text-sm">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                {section.title === '5. Why We Collect and Use Your Data (Our Lawful Basis)' ? (
                                                                    <>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Purpose of Collection</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Lawful Basis</th>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Cookie Name</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Provider</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Purpose</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Type</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Expiry</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Category</th>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {section.tableData.map((row: { purpose?: string; basis?: string; cookieName?: string; provider?: string; type?: string; expiry?: string; category?: string }, rowIndex: number) => (
                                                                <tr key={rowIndex}>
                                                                    {section.title === '5. Why We Collect and Use Your Data (Our Lawful Basis)' ? (
                                                                        <>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.purpose}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.basis}</td>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.cookieName}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.provider}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.purpose}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.type}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.expiry}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.category}</td>
                                                                        </>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

