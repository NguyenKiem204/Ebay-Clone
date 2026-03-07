import { HeroBanner } from '../features/products/components/HeroBanner';
import { FeaturedCategories } from '../features/products/components/FeaturedCategories';
import { TodaysDeals } from '../features/products/components/TodaysDeals';
import { TrendingCategories } from '../features/products/components/TrendingCategories';
import { MainPromoBanner } from '../features/products/components/MainPromoBanner';
import { GuaranteeBanner } from '../features/products/components/GuaranteeBanner';
import { MotorsPromoBanner } from '../features/products/components/MotorsPromoBanner';
import { PromoBanners } from '../features/products/components/PromoBanners';
import { mockCategories, mockTrending } from '../lib/mockData';

export default function HomePage() {
    return (
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 xl:px-4 py-6">
            <HeroBanner />
            <FeaturedCategories />
            <GuaranteeBanner />
            <MotorsPromoBanner />
            <TrendingCategories title="The future in your hands" data={mockCategories} />



            <TodaysDeals />

            <TrendingCategories title="Trending on eBay" data={mockTrending} />

            <MainPromoBanner />
            <PromoBanners />
        </div>
    );
}
