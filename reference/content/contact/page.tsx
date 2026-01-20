'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useToastStore } from '@/store/toastStore';
import ScrollTextAnimation from '@/components/common/ScrollTextAnimation';
import { apiFetch } from '@/services/apiClient';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToastStore();
    const [pageContent, setPageContent] = useState({
        headerImage: '/images/headers/contact-header.jpg',
        title: 'CONTACT US',
        subTitle: 'WE\'D LOVE TO HEAR FROM YOU'
    });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await apiFetch<{ content: string }>('/api/content/contact');
                if (res.content) {
                    const parsed = JSON.parse(res.content);
                    setPageContent(prev => ({
                        ...prev,
                        headerImage: parsed.headerImage || prev.headerImage,
                        title: parsed.title || prev.title,
                        subTitle: parsed.subTitle || prev.subTitle
                    }));
                }
            } catch (error) {
                console.error('Failed to load page content', error);
            }
        };
        fetchContent();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await apiFetch<any>('/api/contact', {
                method: 'POST',
                auth: false,
                body: JSON.stringify(formData),
            });

            if (result?.success) {
                addToast({
                    type: 'success',
                    title: 'Message Sent',
                    message: 'Thank you for your message! We\'ll get back to you soon.',
                });
                setFormData({ name: '', email: '', message: '' });
            } else {
                console.error('Contact form error:', result);
                addToast({
                    type: 'error',
                    title: 'Failed to Send',
                    message: result.error || 'Failed to send message. Please try again.',
                });
            }
        } catch (error) {
            console.error('Network error:', error);
            addToast({
                type: 'error',
                title: 'Failed to Send',
                message: 'Network error. Please check your connection and try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="relative w-full overflow-hidden pb-20 bg-black">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={pageContent.headerImage}
                    alt="Contact Background"
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
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50"></div>
            </div>

            {/* Contact Form Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-xl">
                    {/* Header */}
                    <div className="flex flex-col items-center justify-center text-center mb-14 mt-25">
                        <ScrollTextAnimation className="text-white text-[36px] md:text-6xl font-extralight uppercase tracking-wide mb-4" delay={0.2} duration={1.2}>
                            {pageContent.title}
                        </ScrollTextAnimation>
                        <p className="text-white/80 text-sm md:text-base font-extralight uppercase tracking-wide">
                            {pageContent.subTitle}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="FULL NAME *"
                                className="w-full px-6 py-4 bg-transparent border-2 border-white/60 text-white placeholder-white/80 font-extralight tracking-wide focus:outline-none focus:border-luxury-white transition-all duration-300"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="EMAIL ADDRESS *"
                                className="w-full px-6 py-4 bg-transparent border-2 border-white/60 text-white placeholder-white/80 font-extralight tracking-wide focus:outline-none focus:border-luxury-white transition-all duration-300"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={5}
                                placeholder="HOW CAN WE HELP *"
                                className="w-full px-6 py-4 bg-transparent border-2 border-white/60 text-white placeholder-white/80 font-extralight tracking-wide focus:outline-none focus:border-brand-cream transition-all duration-300 resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/60 text-white font-extralight uppercase tracking-wide hover:bg-white/20 hover:border-luxury-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {isSubmitting ? 'SENDING...' : 'SUBMIT'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

