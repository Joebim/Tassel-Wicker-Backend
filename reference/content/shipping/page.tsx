'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { LuChevronDown } from 'react-icons/lu';
import ScrollTextAnimation from '@/components/common/ScrollTextAnimation';
import CircularText from '@/components/common/CircularText';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import DocumentViewerLink from '@/components/common/DocumentViewer';
import { useContent } from '@/hooks/useContent';

export default function Shipping() {
    const { data: contentData, isLoading } = useContent('shipping');

    // Parse content
    const pageContent = (() => {
        const defaultContent = {
            headerImage: '/images/headers/shipping-header.jpg',
            title1: 'SHIPPING',
            title2: 'INFORMATION',
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
            title: 'PROCESSING TIME',
            content:
                'Please allow 1 - 2 business days for processing before your parcel begins its journey. During busy seasons or for custom items, processing may take a little longer.',
        },
        {
            title: 'SHIPPING OPTIONS',
            content:
                'We currently offer standard shipping across the United Kingdom. Shipping costs are calculated at checkout based on your location and order size.',
        },
        {
            title: 'DELIVERY TIMELINE',
            content:
                'Once dispatched, standard delivery typically arrives within 2-3 business days, depending on your location.',
        },
        {
            title: 'ORDER TRACKING',
            content:
                'When your order is on its way, you will receive a confirmation email with tracking details so you can follow its journey home to you.',
        },
        {
            title: 'INTERNATIONAL SHIPPING',
            content:
                'We provide international shipping to most countries around the world. Please be aware that customs fees or import duties may apply based on your location. Shipping options and delivery estimates will be shown at checkout and full tracking will be provided once your order is dispatched.',
        },
        {
            title: 'QUESTIONS OR SPECIAL REQUEST',
            content:
                'If you have a special request, a note to include, or any questions about your delivery, we\'d love to hear from you. You can reach out to us at info@tasselandwicker.com.',
        },
    ];

    return (
        <div className="min-h-screen bg-white text-luxury-black">
            {/* Hero */}
            <section className="relative h-screen w-full overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={pageContent.headerImage}
                        alt="Shipping information"
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
                                        document.getElementById('shipping-content')?.scrollIntoView({ behavior: 'smooth' });
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
            <section id="shipping-content" className="py-16">
                <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-luxury-black font-extralight">Loading...</p>
                        </div>
                    ) : (
                        <>
                            {documentUrl && (
                                <DocumentViewerLink title="Shipping Information Document" pageSlug="shipping" />
                            )}
                            {pageContent.body ? (
                                <RichTextRenderer content={pageContent.body} />
                            ) : (
                                // Fallback to original content structure if API fails
                                <div className="prose prose-lg max-w-none text-luxury-black leading-relaxed space-y-8">
                                    <div className="mb-8">
                                        <p className="text-base text-luxury-black font-extralight mb-8">
                                            At Tassel & Wicker, every order is prepared with care and attention. From the moment your baskets are wrapped to the moment they arrive at your home, we want the experience to feel considered.
                                        </p>
                                    </div>
                                    {sections.map((section) => (
                                        <div key={section.title} className="mb-8">
                                            <h2 className="text-xl font-extralight uppercase text-luxury-black mb-4 mt-8">
                                                {section.title}
                                            </h2>
                                            <div className="text-base text-luxury-black font-extralight leading-relaxed whitespace-pre-line mb-6">
                                                {section.content}
                                            </div>
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
