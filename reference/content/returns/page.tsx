'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { LuChevronDown } from 'react-icons/lu';
import ScrollTextAnimation from '@/components/common/ScrollTextAnimation';
import CircularText from '@/components/common/CircularText';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import DocumentViewerLink from '@/components/common/DocumentViewer';
import { useContent } from '@/hooks/useContent';

export default function ReturnsExchanges() {
    const { data: contentData, isLoading } = useContent('returns');

    // Parse content
    const pageContent = (() => {
        const defaultContent = {
            headerImage: '/images/headers/returns-header.jpg',
            title1: 'RETURNS &',
            title2: 'EXCHANGES',
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

    return (
        <div className="min-h-screen bg-white text-luxury-black">
            {/* Hero */}
            <section className="relative h-screen w-full overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={pageContent.headerImage}
                        alt="Returns and exchanges"
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
                                        document.getElementById('returns-content')?.scrollIntoView({ behavior: 'smooth' });
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
            <section id="returns-content" className="py-16">
                <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-luxury-black font-extralight">Loading...</p>
                        </div>
                    ) : (
                        <>
                            {documentUrl && (
                                <DocumentViewerLink title="Returns & Exchanges Document" pageSlug="returns" />
                            )}
                            {pageContent.body ? (
                                <RichTextRenderer content={pageContent.body} />
                            ) : (
                                // Fallback to original content if API fails
                                <div className="prose prose-lg max-w-none text-luxury-black leading-relaxed space-y-8">
                                    <div className="mb-8">
                                        <p className="text-base text-luxury-black font-extralight leading-relaxed mb-6">
                                            Due to the nature of our small-batch collections and the attention that goes into each order, we currently do not offer returns once a purchase has been made.
                                        </p>
                                        <p className="text-base text-luxury-black font-extralight leading-relaxed mb-6">
                                            That said, we understand that life happens and that receiving your parcel in excellent condition matters. If your order arrives and there&apos;s an issue with the condition of the item(s), please reach out to us within 7 days of delivery. We&apos;ll be happy to assist with an exchange or resolution if the product is returned in its original, unused condition and packaging.
                                        </p>
                                        <p className="text-base text-luxury-black font-extralight leading-relaxed mb-6">
                                            To begin an exchange or to share any concerns, kindly contact us at{' '}
                                            <a
                                                href="mailto:info@tasselandwicker.com"
                                                className="underline hover:text-brand-purple transition-colors"
                                            >
                                                info@tasselandwicker.com
                                            </a>
                                            {' '}with your order number and a brief note about your situation. Our team will guide you through the next steps with care.
                                        </p>
                                        <p className="text-base text-luxury-black font-extralight leading-relaxed mb-6">
                                            We deeply value your trust in Tassel & Wicker and appreciate your understanding as we uphold the integrity and craftsmanship behind each item we send out.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
