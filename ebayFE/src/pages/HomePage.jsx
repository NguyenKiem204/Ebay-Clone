import { useEffect } from 'react';
import { HeroBanner } from '../features/products/components/HeroBanner';
import { FeaturedCategories } from '../features/products/components/FeaturedCategories';
import { TodaysDeals } from '../features/products/components/TodaysDeals';
import { TrendingCategories } from '../features/products/components/TrendingCategories';
import { MainPromoBanner } from '../features/products/components/MainPromoBanner';
import { GuaranteeBanner } from '../features/products/components/GuaranteeBanner';
import { MotorsPromoBanner } from '../features/products/components/MotorsPromoBanner';
import { PromoBanners } from '../features/products/components/PromoBanners';
import { RecentlyViewed } from '../features/products/components/RecentlyViewed';
import useProductStore from '../store/useProductStore';
import useCategoryStore from '../store/useCategoryStore';

export default function HomePage() {
    const { fetchLandingPage, trendingProducts } = useProductStore();
    const { fetchCategories, categories } = useCategoryStore();

    useEffect(() => {
        fetchLandingPage();
        fetchCategories();
    }, [fetchLandingPage, fetchCategories]);

    return (
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 xl:px-4 py-6">
            <HeroBanner />
            <RecentlyViewed />
            <FeaturedCategories categories={categories.slice(0, 7)} />
            <GuaranteeBanner />
            <MotorsPromoBanner />
            <TodaysDeals />
            <TrendingCategories title="Trending on eBay" data={categories.slice(12, 19)} />
            <MainPromoBanner />
            <PromoBanners />
        </div>
    );
}
