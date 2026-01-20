'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LuSearch, LuArrowLeft, LuX, LuFilter } from 'react-icons/lu';
import LuxuryProductCard from '@/components/shop/LuxuryProductCard';
import { useCartStore } from '@/store/cartStore';
import { getDefaultImage, getDefaultPrice } from '@/utils/productHelpers';
import type { ProductDataItem } from '@/types/productData';
import { backendProducts, backendCategories } from '@/services/backend';
import { toProductDataItem } from '@/utils/backendProductMapper';
import { useToastStore } from '@/store/toastStore';
import { ProductGridSkeleton } from '@/components/common/SkeletonLoader';
import type { ListProductsParams } from '@/services/backend/products';

const priceRanges = ['All', 'Free', 'Under £200', '£200 - £500', 'Over £500'];

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(() => searchParams.get('category') || 'All');
    const [selectedPrice, setSelectedPrice] = useState<string>(() => {
        // Try to reconstruct price string from URL params if possible, or default to All
        // This is a simplification; ideally we'd parse min/max back to string or separate them.
        // For this implementation, we will sync local state to URL conceptually but here we initialize simpler.
        return 'All';
    });

    // We will parse URL params directly in the effect or use local state as source of truth.
    // Let's use local state as the driver for UI, and sync to URL.

    const { addItem } = useCartStore();

    const updateQueryParams = useCallback(
        (nextSearch: string, nextCategory: string, nextPrice: string) => {
            const params = new URLSearchParams();
            const trimmed = nextSearch.trim();
            if (trimmed) {
                params.set('search', trimmed);
            }
            if (nextCategory !== 'All') {
                params.set('category', nextCategory);
            }
            if (nextPrice !== 'All') {
                params.set('price', nextPrice);
            }
            const queryString = params.toString();
            router.push(queryString ? `/search?${queryString}` : '/search');
        },
        [router]
    );

    const [combinedProducts, setCombinedProducts] = useState<Array<ProductDataItem>>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [categories, setCategories] = useState<string[]>(['All']);

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

    const getPriceParams = (priceRange: string) => {
        switch (priceRange) {
            case 'Free': return { maxPrice: 0 };
            case 'Under £200': return { maxPrice: 200 };
            // Handle both $ and £ for robustness if user didn't update everything
            case 'Under $200': return { maxPrice: 200 };
            case '£200 - £500': return { minPrice: 200, maxPrice: 500 };
            case '$200 - $500': return { minPrice: 200, maxPrice: 500 };
            case 'Over £500': return { minPrice: 500 };
            case 'Over $500': return { minPrice: 500 };
            default: return {};
        }
    };

    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                setIsLoadingProducts(true);

                const priceParams = getPriceParams(selectedPrice);
                const queryParams: ListProductsParams = {
                    page: 1,
                    limit: 500,
                    search: searchTerm,
                    ...priceParams
                };

                if (selectedCategory !== 'All') {
                    queryParams.category = selectedCategory;
                }

                const res = await backendProducts.listProducts(queryParams);

                if (!alive) return;
                // Map backend products into the UI product shape used across the shop/search pages.
                setCombinedProducts((res.items || []).map((p) => toProductDataItem(p)));
            } catch (e) {
                useToastStore.getState().addToast({
                    type: 'error',
                    title: 'Failed to load products',
                    message: e instanceof Error ? e.message : 'Could not load products.',
                });
                setCombinedProducts([]);
            } finally {
                if (alive) setIsLoadingProducts(false);
            }
        };
        // Debounce search slightly to avoid too many requests? 
        // For now, simpler to just run on dependency change.
        const timer = setTimeout(load, 300);
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [searchTerm, selectedCategory, selectedPrice]);

    // Products are now already filtered from backend
    const filteredProducts = combinedProducts;

    // Keep local state in sync with URL params when navigation occurs (back/forward)
    useEffect(() => {
        setSearchTerm(searchParams.get('search') || '');
        const urlPrice = searchParams.get('price');
        if (urlPrice && priceRanges.includes(urlPrice)) {
            setSelectedPrice(urlPrice);
        } else {
            setSelectedPrice('All');
        }
    }, [searchParams]); // removed categories dependency to avoid loop

    useEffect(() => {
        const urlCategory = searchParams.get('category');
        // We accept the URL category even if not in the current 'derived' list to allow loading initial state correctly
        if (urlCategory) {
            setSelectedCategory(urlCategory);
        } else {
            setSelectedCategory('All');
        }
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateQueryParams(searchTerm, selectedCategory, selectedPrice);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        updateQueryParams('', selectedCategory, selectedPrice);
    };

    const handleAddToCart = (product: ProductDataItem) => {
        const defaultImage = 'variants' in product && product.variants && product.variants.length > 0
            ? getDefaultImage(product as ProductDataItem)
            : (product.image || '');
        const defaultPrice = 'variants' in product && product.variants && product.variants.length > 0
            ? getDefaultPrice(product as ProductDataItem)
            : (product.price || 0);
        addItem({
            id: product.id,
            name: product.name,
            price: defaultPrice,
            image: defaultImage,
            category: product.category,
            description: product.description || product.name,
        });
    };

    const handleClearFilters = () => {
        setSelectedCategory('All');
        setSelectedPrice('All');
        updateQueryParams(searchTerm, 'All', 'All');
    };

    const hasActiveFilters = selectedCategory !== 'All' || selectedPrice !== 'All';

    return (
        <div className="min-h-screen bg-white pt-12">
            {/* Header Section */}
            <div className="bg-white border-b border-luxury-warm-grey/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-luxury-charcoal hover:text-brand-purple transition-colors duration-200 cursor-pointer"
                        >
                            <LuArrowLeft size={20} />
                            <span className="font-extralight uppercase tracking-wide">Back</span>
                        </button>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="relative">
                        <div className="relative">
                            <LuSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-luxury-cool-grey" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search for products..."
                                className="w-full pl-12 pr-12 py-4 border border-luxury-warm-grey/20 rounded-lg bg-white focus:outline-none focus:border-brand-purple/50 transition-colors duration-200 font-extralight text-luxury-black placeholder-luxury-cool-grey"
                                autoFocus
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-luxury-cool-grey hover:text-luxury-black transition-colors"
                                >
                                    <LuX size={20} />
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Results Count */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-luxury-cool-grey font-extralight uppercase text-sm">
                            {isLoadingProducts
                                ? 'Loading…'
                                : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'result' : 'results'} found`}
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={handleClearFilters}
                                className="text-luxury-cool-grey hover:text-luxury-black font-extralight uppercase text-sm transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content with Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filter Sidebar */}
                    <div className="w-full lg:w-64 shrink-0 hidden lg:block">
                        <div className="bg-white border border-luxury-warm-grey/20 rounded-lg p-6 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                            <div className="flex items-center gap-2 mb-6 sticky top-0 bg-white pb-2 z-10">
                                <LuFilter size={18} className="text-luxury-charcoal" />
                                <h3 className="text-lg font-extralight text-luxury-charcoal uppercase">Filters</h3>
                            </div>

                            {/* Category Filter */}
                            <div className="mb-8">
                                <label className="block text-sm font-extralight text-luxury-charcoal mb-4 uppercase">
                                    Category
                                </label>
                                <div className="space-y-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                updateQueryParams(searchTerm, category, selectedPrice);
                                            }}
                                            className={`w-full px-4 py-2 text-sm rounded-lg transition-all duration-200 text-left font-extralight uppercase ${selectedCategory === category
                                                ? 'bg-brand-purple text-luxury-white'
                                                : 'bg-luxury-warm-grey/10 text-luxury-charcoal hover:bg-luxury-warm-grey/20'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Filter */}
                            <div>
                                <label className="block text-sm font-extralight text-luxury-charcoal mb-4 uppercase">
                                    Price Range
                                </label>
                                <div className="space-y-2">
                                    {priceRanges.map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => {
                                                setSelectedPrice(range);
                                                updateQueryParams(searchTerm, selectedCategory, range);
                                            }}
                                            className={`w-full px-4 py-2 text-sm rounded-lg transition-all duration-200 text-left font-extralight uppercase ${selectedPrice === range
                                                ? 'bg-brand-purple text-luxury-white'
                                                : 'bg-luxury-warm-grey/10 text-luxury-charcoal hover:bg-luxury-warm-grey/20'
                                                }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {isLoadingProducts ? (
                            <ProductGridSkeleton count={6} />
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredProducts.map((product) => (
                                    <LuxuryProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={handleAddToCart}
                                    />
                                ))}
                            </div>
                        ) : searchTerm || hasActiveFilters ? (
                            <div className="text-center py-20">
                                <div className="mb-6">
                                    <LuSearch size={64} className="text-luxury-cool-grey mx-auto mb-4" />
                                </div>
                                <h2 className="text-2xl font-extralight text-luxury-black mb-4 uppercase">
                                    No products found
                                </h2>
                                <p className="text-luxury-cool-grey font-extralight mb-8">
                                    Try adjusting your search or filters
                                </p>
                                <div className="flex gap-4 justify-center">
                                    {searchTerm && (
                                        <button
                                            onClick={handleClearSearch}
                                            className="border border-luxury-charcoal text-luxury-charcoal px-6 py-3 font-extralight uppercase hover:bg-luxury-charcoal hover:text-luxury-white transition-colors duration-200"
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                    {hasActiveFilters && (
                                        <button
                                            onClick={handleClearFilters}
                                            className="border border-luxury-charcoal text-luxury-charcoal px-6 py-3 font-extralight uppercase hover:bg-luxury-charcoal hover:text-luxury-white transition-colors duration-200"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="mb-6">
                                    <LuSearch size={64} className="text-luxury-cool-grey mx-auto mb-4" />
                                </div>
                                <h2 className="text-2xl font-extralight text-luxury-black mb-4 uppercase">
                                    Start searching
                                </h2>
                                <p className="text-luxury-cool-grey font-extralight">
                                    Enter a search term to find products
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Search() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white pt-12 flex items-center justify-center">
                <div className="text-luxury-cool-grey font-extralight">Loading...</div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
