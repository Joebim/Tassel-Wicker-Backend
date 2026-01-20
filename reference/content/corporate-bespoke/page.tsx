'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ScrollTextAnimation from '@/components/common/ScrollTextAnimation';
import CircularText from '@/components/common/CircularText';
import { LuChevronDown } from 'react-icons/lu';
import { contactService } from '@/services/contactService';
import { useToastStore } from '@/store/toastStore';
import { useWindowWidth } from '@/hooks/useWindowsWidth';
import { apiFetch } from '@/services/apiClient';

export default function CorporateBespoke() {
    const { isDesktop } = useWindowWidth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToastStore();

    const [pageContent, setPageContent] = useState({
        headerImageDesktop: '/images/headers/corporate-bespoke-header.jpg',
        headerImageMobile: '/images/headers/corporate-bespoke-header-mobile.jpg',
        descriptionText: 'Transform ordinary gestures into memorable experiences with our corporate and bespoke collection. To explore this offering, get in touch with us by filling the form below.'
    });

    // Fetch page content
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await apiFetch<{ content: string }>('/api/content/corporate-bespoke');
                if (res.content) {
                    const parsed = JSON.parse(res.content);
                    setPageContent(prev => ({
                        ...prev,
                        headerImageDesktop: parsed.headerImageDesktop || prev.headerImageDesktop,
                        headerImageMobile: parsed.headerImageMobile || prev.headerImageMobile,
                        descriptionText: parsed.descriptionText || prev.descriptionText
                    }));
                }
            } catch (error) {
                console.error('Failed to load page content', error);
            }
        };
        fetchContent();
    }, []);

    // Set image source based on screen size
    const heroImageSrc = isDesktop
        ? pageContent.headerImageDesktop
        : pageContent.headerImageMobile;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        // Convert description to message format for contactService
        const result = await contactService.sendEmail({
            name: formData.name,
            email: formData.email,
            phone: '', // Corporate form doesn't have phone
            message: formData.description,
        });

        if (result.success) {
            addToast({
                type: 'success',
                title: 'Message Sent',
                message: 'Thank you for your inquiry! We\'ll get back to you soon.',
            });
            setFormData({ name: '', email: '', description: '' });
        } else {
            addToast({
                type: 'error',
                title: 'Failed to Send',
                message: result.error || 'Failed to send message. Please try again.',
            });
        }

        setIsSubmitting(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="bg-white text-luxury-black min-h-screen">
            {/* Hero */}
            <section className="relative h-screen w-full overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={heroImageSrc}
                        alt="Corporate and bespoke service"
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
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                </div>
                <div className="relative z-10 h-full w-full flex flex-row items-end sm:items-start justify-end lg:items-end lg:justify-between gap-7 sm:gap-10 px-6 sm:px-10 lg:px-12 pb-12">
                    <div className=" flex flex-row items-end justify-between self-end w-full">
                        <div className="max-w-5xl text-white text-left lg:text-left">
                            <ScrollTextAnimation
                                className="text-[30px] sm:text-[90px] font-extralight tracking-wide uppercase leading-none"
                                delay={0.3}
                                duration={1.2}
                            >
                                CORPORATE &
                            </ScrollTextAnimation>
                            <ScrollTextAnimation
                                className="text-[30px] sm:text-[90px] font-extralight tracking-wide uppercase leading-none"
                                delay={0.5}
                                duration={1.2}
                            >
                                BESPOKE SERVICE
                            </ScrollTextAnimation>
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        document.getElementById('corporate-content')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                                className="relative"
                                aria-label="Learn more"
                            >
                                <CircularText
                                    text="DISCOVER • DISCOVER • "
                                    spinDuration={15}
                                    onHover="speedUp"
                                    className="w-[70px] h-[70px] leading-0.5 sm:w-[120px] sm:h-[120px] text-[11px] sm:text-[12px]"
                                />
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <LuChevronDown size={24} className="text-white animate-bounce" aria-hidden="true" />
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* Content */}
            <motion.section
                id="corporate-content"
                className="py-20"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
                    <motion.div variants={itemVariants} className="text-center mb-14">
                        <p className="text-lg md:text-xl text-luxury-charcoal font-extralight leading-relaxed">
                            {pageContent.descriptionText}
                        </p>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSubmit}
                        variants={itemVariants}
                        className="bg-white/70 backdrop-blur-sm border border-luxury-warm-grey/20 shadow-xl rounded-3xl px-6 py-8 sm:px-10 sm:py-12 space-y-8"
                    >
                        <div className="space-y-2">
                            <label className="uppercase text-xs tracking-[0.3em] text-luxury-charcoal font-light">
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter your name"
                                className="w-full border border-luxury-warm-grey/30 bg-white/80 rounded-xl px-5 py-4 font-extralight text-luxury-charcoal focus:outline-none focus:border-brand-purple/60 focus:ring-2 focus:ring-brand-purple/10 transition-all duration-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="uppercase text-xs tracking-[0.3em] text-luxury-charcoal font-light">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="Enter your email address"
                                className="w-full border border-luxury-warm-grey/30 bg-white/80 rounded-xl px-5 py-4 font-extralight text-luxury-charcoal focus:outline-none focus:border-brand-purple/60 focus:ring-2 focus:ring-brand-purple/10 transition-all duration-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="uppercase text-xs tracking-[0.3em] text-luxury-charcoal font-light">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={6}
                                placeholder="Tell us more about how you'd like us to serve you, including proposed products for the baskets, specifications, timelines, and any other details you consider important."
                                className="w-full border border-luxury-warm-grey/30 bg-white/80 rounded-xl px-5 py-4 font-extralight text-luxury-charcoal focus:outline-none focus:border-brand-purple/60 focus:ring-2 focus:ring-brand-purple/10 transition-all duration-200 resize-none"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full md:w-auto inline-flex items-center justify-center px-10 py-4 uppercase tracking-[0.4em] text-sm font-light bg-brand-purple text-white rounded-full hover:bg-brand-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {isSubmitting ? 'SENDING...' : 'Submit'}
                            </button>
                        </div>
                    </motion.form>
                </div>
            </motion.section>
        </div>
    );
}

