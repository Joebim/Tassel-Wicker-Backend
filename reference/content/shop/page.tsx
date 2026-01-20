'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LuFilter, LuGrip, LuList, LuChevronDown } from 'react-icons/lu';
import LuxuryFilter from '@/components/shop/LuxuryFilter';
import LuxuryProductCard from '@/components/shop/LuxuryProductCard';
import CircularText from '@/components/common/CircularText';
import { useCartStore } from '@/store/cartStore';
import ScrollTextAnimation from '@/components/common/ScrollTextAnimation';
import ScrollVelocity from '@/components/common/ScrollVelocity';
import type { ShopProduct } from '@/types/productData';
import { useWindowWidth } from '@/hooks/useWindowsWidth';
import { backendProducts, backendCategories } from '@/services/backend';
import { toShopProduct } from '@/utils/backendProductMapper';
import { useToastStore } from '@/store/toastStore';
import { ProductGridSkeleton } from '@/components/common/SkeletonLoader';
import type { ListProductsParams } from '@/services/backend/products';
import { apiFetch } from '@/services/apiClient';
import RichTextRenderer from '@/components/common/RichTextRenderer';

export default function Shop() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<{ category?: string; price?: string }>({});
  const { addItem } = useCartStore();
  const { isDesktop } = useWindowWidth();
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [pageContent, setPageContent] = useState({
    headerImage: '/images/headers/shop-header.jpg',
    introText: 'OUR PRODUCTS',
    secondaryIntroTextMobile: 'The Tassel & Wicker signature baskets are inspired by the friendships and relationships that sustain us. We believe that when we give thoughtfully, we communicate presence, intention, and appreciation in ways words alone cannot.',
    secondaryIntroTextDesktop: 'The Tassel & Wicker signature baskets are inspired by the friendships and relationships that sustain us. We believe that when we give thoughtfully, we communicate presence, intention, and appreciation in ways words alone cannot.',
    scrollVelocityText: 'SHOP NOW • SHOP NOW • SHOP NOW • '
  });

  // Fetch page content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await apiFetch<{ content: string }>('/api/content/shop');
        if (res.content) {
          const parsed = JSON.parse(res.content);
          setPageContent(prev => ({
            ...prev,
            headerImage: parsed.headerImage || prev.headerImage,
            introText: parsed.introText || prev.introText,
            secondaryIntroTextMobile: parsed.secondaryIntroTextMobile || prev.secondaryIntroTextMobile,
            secondaryIntroTextDesktop: parsed.secondaryIntroTextDesktop || prev.secondaryIntroTextDesktop,
            scrollVelocityText: parsed.scrollVelocityText || prev.scrollVelocityText
          }));
        }
      } catch (error) {
        console.error('Failed to load page content', error);
      }
    };
    fetchContent();
  }, []);

  const handleAddToCart = (product: ShopProduct) => {
    const price = product.price ?? 0;
    const image = product.image ?? '';
    const basketItems = product.items && product.items.length > 0
      ? product.items.map((item) => ({
        name: item.name,
        image: item.image,
        category: item.category
      }))
      : undefined;

    addItem({
      id: product.id,
      name: product.name,
      price,
      image,
      category: product.category,
      description: product.description,
      basketItems
    });
  };

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await backendCategories.listCategories();
        if (res.items) {
          const categoryNames = res.items.map(c => c.name).sort();
          setCategories(['All', ...categoryNames]);
        }
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    loadCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setIsLoadingProducts(true);

        // Map filter state to API parameters
        const params: ListProductsParams = {
          page: 1,
          limit: 200,
          role: 'main' // Only fetch main products
        };

        // Category Filter
        if (filters.category && filters.category !== 'All') {
          params.category = filters.category;
        }

        // Price Filter
        if (filters.price && filters.price !== 'All') {
          switch (filters.price) {
            case 'Free':
              params.maxPrice = 0;
              break;
            case 'Under £200':
              params.maxPrice = 200;
              break;
            case '£200 - £500':
              params.minPrice = 200;
              params.maxPrice = 500;
              break;
            case 'Over £500':
              params.minPrice = 500;
              break;
          }
        }

        const res = await backendProducts.listProducts(params);
        if (!alive) return;
        setProducts((res.items || []).map((p) => toShopProduct(p)));
      } catch (e) {
        useToastStore.getState().addToast({
          type: 'error',
          title: 'Failed to load products',
          message: e instanceof Error ? e.message : 'Could not load products.',
        });
        setProducts([]);
      } finally {
        if (alive) setIsLoadingProducts(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [filters]);

  const filteredProducts = products; // Direct assignment since we filter server-side now

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-screen w-full overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <Image
            src={pageContent.headerImage}
            alt="Shop Header"
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
          <div className="absolute inset-0 bg-black opacity-40"></div>
        </div>

        <div className="relative z-10 h-full w-full p-6 sm:p-10 lg:p-12 flex flex-row items-end sm:items-start justify-end lg:flex-row lg:items-end lg:justify-between gap-10">
          <div className="w-full flex flex-row items-end justify-between self-end">
            <div className="flex flex-col text-white max-w-3xl text-left">
              <ScrollTextAnimation
                className="text-[39px] sm:text-5xl lg:text-[110px] font-extralight tracking-wide uppercase leading-none"
                delay={0.2}
                duration={1.2}
              >
                {pageContent.introText}
              </ScrollTextAnimation>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <button
                type="button"
                onClick={() => document.getElementById('shop-content')?.scrollIntoView({ behavior: 'smooth' })}
                className="relative"
                aria-label="Shop Now"
              >
                <CircularText
                  text={pageContent.scrollVelocityText}
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
      </div>

      <div className="flex flex-col items-center justify-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-0 sm:pb-14 text-center">
        <h2 className="text-[12px] sm:text-[20px] lg:text-3xl font-light text-luxury-black leading-relaxed mb-6 uppercase tracking-[0.2em]">
          Where intention meets curation <br /> because it&apos;s the{' '}
          <span className="line-through decoration-2 decoration-black">thought</span>{' '}
          gift that <br />counts
        </h2>

        {/* Mobile view - without line breaks, percentage width */}
        <div className="lg:hidden w-[88%] mx-auto">
          <div className="text-[16px] sm:text-lg text-luxury-black font-extralight text-center">
            <RichTextRenderer content={pageContent.secondaryIntroTextMobile} />
          </div>
        </div>

        {/* Desktop view - plain text, two separate paragraphs, percentage width, centered */}
        <div className="hidden lg:flex flex-col items-center justify-center w-[75%] mx-auto">
          <div className="text-lg text-luxury-black font-extralight text-center mb-4">
            <RichTextRenderer content={pageContent.secondaryIntroTextDesktop} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-25 py-16" id="shop-content">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen((o) => !o)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-luxury-warm-grey/20 rounded-xl hover:bg-luxury-warm-grey/5 transition-all duration-200 cursor-pointer"
              >
                <LuFilter size={18} className="text-luxury-charcoal" />
                <span className="text-luxury-charcoal font-extralight uppercase">Filters</span>
                <LuChevronDown size={16} className="text-luxury-charcoal" />
              </button>
              <LuxuryFilter
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onFilterChange={(f) => { setFilters(f); }}
                categories={categories}
                currentFilters={filters}
              />
            </div>

            <div className="text-[12px] sm:text-[15px] text-luxury-cool-grey font-extralight uppercase">
              {isLoadingProducts ? 'Loading…' : `${filteredProducts.length} products`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer ${viewMode === 'grid'
                ? 'bg-brand-purple text-luxury-white'
                : 'bg-luxury-warm-grey/10 text-luxury-charcoal hover:bg-luxury-warm-grey/20'
                }`}
            >
              <LuGrip size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer ${viewMode === 'list'
                ? 'bg-brand-purple text-luxury-white'
                : 'bg-luxury-warm-grey/10 text-luxury-charcoal hover:bg-luxury-warm-grey/20'
                }`}
            >
              <LuList size={18} />
            </button>
          </div>
        </div>

        {isLoadingProducts ? (
          <ProductGridSkeleton count={6} />
        ) : (
          <div className={`grid gap-8 ${viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
            }`}>
            {filteredProducts.map((product) => (
              <LuxuryProductCard
                key={product.id}
                product={product}
                onAddToCart={(item) => handleAddToCart(item as ShopProduct)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="py-8 sm:py-14 bg-amber-50">
        <ScrollVelocity
          texts={[
            <span key="scroll-text" className='font-extralight text-black'>
              IT&apos;S THE{' '}
              <span className="line-through decoration-1 sm:decoration-3 decoration-black">THOUGHT</span>{' '}
              GIFT THAT COUNTS{'  '}
              <span className="mx-4 sm:mx-8">&nbsp;</span>
              COMMITTED TO ELEVATED LIVING
            </span>
          ]}
          velocity={100}
          className="custom-scroll-text"
          scrollerClassName="scroller text-sm md:text-2xl"
          itemSpacing={isDesktop ? "150px" : "60px"}
          scroll='left'
        />
      </div>
    </div>
  );
}

