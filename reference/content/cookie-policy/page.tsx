'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { LuChevronDown } from 'react-icons/lu';
import ScrollTextAnimation from '@/components/common/ScrollTextAnimation';
import CircularText from '@/components/common/CircularText';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import DocumentViewerLink from '@/components/common/DocumentViewer';
import { useContent } from '@/hooks/useContent';

export default function CookiePolicy() {
    const { data: contentData, isLoading } = useContent('cookie-policy');

    // Parse content
    const pageContent = (() => {
        const defaultContent = {
            headerImage: '/images/headers/cookie-policy-header.jpg',
            title1: 'COOKIE',
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
                        body: parsed.body || contentData.content
                    };
                }
            } catch {
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
            title: '1. General Introduction About Cookies',
            content:
                'This Cookie Policy explains what cookies are, how we use them on our website www.tasselandwicker.com(the "Website"), and what your choices are regarding their use.\n\nThis policy should be read alongside our Privacy Policy which sets out how we process your personal data.',
        },
        {
            title: '2. What are Cookies?',
            content:
                'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide reporting information.\n\nCookies can be:\n\nSession Cookies: These are temporary and expire once you close your browser.\n\nPersistent Cookies: These remain on your device for a set period or until you delete them.\n\nCookies can also be:\n\nFirst-Party Cookies: Set directly by the Website you are visiting.\n\nThird-Party Cookies: Set by a different domain (a third party) than the one you are visiting, typically for advertising or analytics.',
        },
        {
            title: '3. How We Use Cookies',
            content:
                'We can only store cookies on your device if they are strictly necessary for the operation of this Website or the provision of a service you have explicitly requested like maintaining your shopping cart.\n\nFor all other non-essential cookies like analytics, performance, and marketing cookies, we must obtain your prior, informed, and explicit consent before setting them.',
            subsections: [
                {
                    title: '3.1 Category of Cookies:',
                    content:
                        'We use the following categories of cookies for the purposes detailed below. You have the right to choose which non-essential cookies we can use.\n\nStrictly Necessary Cookies\n\nEssential for the core functionality of the website like security, networking, accessibility, remembering items in a shopping basket. This type of cookie does not require consent.\n\nPerformance/Analytics Cookies\n\nAllows us to count visits and traffic sources so we can measure and improve the performance of our site. Data is typically aggregated like Google Analytics.\n\nFunctional/Preference Cookies\n\nEnables the website to provide enhanced functionality and personalisation like  remembering your language, region, or login details.\n\nTargeting/Advertising Cookies\n\nSet through our site by our advertising partners. They are used to build a profile of your interests and show you relevant adverts on other sites.',
                },
                {
                    title: '3.2 Objectives, aims',
                    content:
                        'We use the cookies to:\n\nEnsure efficient and safe functioning of the Website; we use cookies to enable and support our security features, and to help us detect malicious activity on our Website;\n\nUnderstand, improve, and research products, features, and services, including when you access our Website from other websites, applications, or devices such as your work computer or your mobile device;\n\nRecognize the returning visitors of the Website; cookies help us show you the right information and personalize your experience; cookies also help avoiding re-registration or re-filling of the information by you each time you visit the Website;\n\nAnalyse your habits so that the functioning of the Website would be convenient, efficient and would conform to your needs and expectations, for example, by ensuring that the Visitors would, without difficulty, find everything they are looking for;\n\nMeasure the flows of the information and data being sent to our Website; we use the cookies for accumulation of statistical data about the number of users of the Website and their use of the Website;\n\nTargeting and advertising; by using the cookies we may collect information so that only relevant content is displayed for the browser by creating different target groups; we may use cookies to show you relevant advertising both on and off our Website.\n\nWe may, to the extent allowed by applicable laws, link the data, received from the cookies, with other information obtained about you from other legal sources (i.e., information about the use of the services, online account, etc.).',
                },
                {
                    title: '3.3 Third Party Cookies Disclosure',
                    content:
                        'Our website includes content and functionality provided by third parties. When you interact with these services, the third-party provider may process your data using cookies or similar technologies. These providers include:\n\nAdvertising & Marketing Partners:\n\nPayment Processors:',
                },
                {
                    title: '3.4. Detailed Cookie List:',
                    content:
                        '',
                    hasTable: true,
                    tableData: [
                        { cookieName: '_stripe_mid', provider: 'Stripe', purpose: 'Used for fraud prevention and distinguishing users during payment. Helps Stripe identify the device for secure checkout.', type: 'Third party(Strict)', expiry: '1 year', category: 'Strictly Necessary' },
                        { cookieName: '__vercel_toolbar', provider: 'Vercel', purpose: 'Enables the Vercel developer toolbar in preview environments. Not used for tracking.', type: 'First-party', expiry: '17 days', category: 'Functional/Performance' },
                        { cookieName: 'auth-storage', provider: 'This Website(Next.js + Firebase Auth)', purpose: 'Stores encoded authentication/session data for logged-in users', type: 'First-Party', expiry: '128', category: 'Strictly Necessary' },
                        { cookieName: 'cookieConsent', provider: 'This Website', purpose: 'Stores whether the user accepted the cookie banner', type: 'First-Party', expiry: '21 days', category: 'Preferences' },
                    ],
                },
            ],
        },
        {
            title: '4. Your Consent and How to Manage Cookies',
            content:
                'You have control over the use of non-essential cookies. When you first visit our Website, you will be presented with a clear consent tool (a cookie banner) that gives you the following options:\n\n"Accept All": To consent to all cookie categories.\n\n"Reject All" (or "Block All"): To decline all non-essential cookies.\n\n"Manage Preferences" (or "Customise"): To choose which specific categories you consent to (e.g., accepting analytics but rejecting marketing).',
            subsections: [
                {
                    title: '4.1 How to Change Your Preferences:',
                    content:
                        'To change your cookie preferences, please follow this link  depending on your device and browser\n\nAlternatively, most web browsers allow you to control cookies through their settings. You can usually find these settings in the \'options\' or \'preferences\' menu of your browser. For more information, you can visit the links below:\n\nChrome Cookie Settings: https://policies.google.com/technologies/cookies?hl=en-US/\n\nFirefox Cookie Setting: https://www.firefox.com/en-US/privacy/websites/cookie-settings/\n\nSafari Cookie Setting: https://support.apple.com/en-ca/guide/safari/ibrw850f6c51/mac\n\nEdge/IE Cookie Settings: https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64',
                },
            ],
        },
        {
            title: '5. Changes to this Cookie Policy',
            content:
                'We may update this policy from time to time to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies. This policy was last updated on November 19, 2025.',
        },
    ];

    return (
        <div className="min-h-screen bg-white text-luxury-black">
            {/* Hero */}
            <section className="relative h-screen w-full overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={pageContent.headerImage}
                        alt="Cookie Policy"
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
                                className="text-[39px] sm:text-5xl lg:text-[110px] font-extralight tracking-wide uppercase leading-none wrap-break-word"
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
                                        document.getElementById('cookie-content')?.scrollIntoView({ behavior: 'smooth' });
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
            <section id="cookie-content" className="py-16">
                <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-luxury-black font-extralight">Loading...</p>
                        </div>
                    ) : (
                        <>
                            {documentUrl && (
                                <DocumentViewerLink title="Cookie Policy Document" pageSlug="cookie-policy" />
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
                                            {section.content && (
                                                <div className="text-base text-luxury-black font-extralight leading-relaxed whitespace-pre-line mb-6">
                                                    {section.content}
                                                </div>
                                            )}
                                            {section.subsections && section.subsections.map((subsection: { title: string; content?: string; hasTable?: boolean; tableData?: Array<{ cookieName: string; provider: string; purpose: string; type: string; expiry: string; category: string }> }, subIndex: number) => (
                                                <div key={subIndex} className="mb-6">
                                                    <h3 className="text-lg font-extralight uppercase text-luxury-black mb-3 mt-6">
                                                        {subsection.title}
                                                    </h3>
                                                    {subsection.content && (
                                                        <div className="text-base text-luxury-black font-extralight leading-relaxed whitespace-pre-line mb-4">
                                                            {subsection.content}
                                                        </div>
                                                    )}
                                                    {subsection.hasTable && subsection.tableData && (
                                                        <div className="mt-6 mb-8 overflow-x-auto">
                                                            <table className="w-full border-collapse border border-gray-300 mt-4 text-sm">
                                                                <thead>
                                                                    <tr className="bg-gray-100">
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Cookie Name</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Provider</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Purpose</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Type</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Expiry</th>
                                                                        <th className="border border-gray-300 px-4 py-3 text-left font-extralight uppercase text-luxury-black">Category</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {subsection.tableData?.map((row, rowIndex: number) => (
                                                                        <tr key={rowIndex}>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.cookieName}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.provider}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.purpose}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.type}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.expiry}</td>
                                                                            <td className="border border-gray-300 px-4 py-3 font-extralight">{row.category}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
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

