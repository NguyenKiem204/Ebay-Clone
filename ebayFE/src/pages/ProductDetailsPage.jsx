import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useProductStore from '../store/useProductStore';
import ImageGallery from '../components/product/ImageGallery';
import ProductPurchaseOptions from '../components/product/ProductPurchaseOptions';
import ProductBreadcrumbs from '../components/product/ProductBreadcrumbs';
import SimilarItemsList from '../components/product/SimilarItemsList';
import RelatedItems from '../components/product/RelatedItems';
import AboutThisItem from '../components/product/AboutThisItem';
import SellerSection from '../components/product/SellerSection/SellerSection';
import ProductCouponSection from '../components/product/ProductCouponSection';

export default function ProductDetailsPage() {
    const { id } = useParams();
    const { currentProduct: product, relatedProducts, loading, error, fetchProductById, fetchRelatedProducts } = useProductStore();

    useEffect(() => {
        if (id) {
            fetchProductById(id);
            fetchRelatedProducts(id);
        }
    }, [id, fetchProductById, fetchRelatedProducts]);

    if (loading && !product) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
                <Link to="/products" className="text-blue-600 hover:underline mt-4 block">Back to products</Link>
            </div>
        );
    }

    const images = product.images && product.images.length > 0
        ? product.images.map(img => img.imageUrl)
        : [product.thumbnail || product.imageUrl];

    return (
        <div className="container mx-auto px-4 pt-1 pb-8 max-w-[1280px]">
            {/* Top Navigation & Promo */}
            <ProductBreadcrumbs product={product} images={images} />

            {/* Main Application Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column: Image Gallery (Span 7) */}
                <div className="md:col-span-7">
                    <div className="sticky top-24">
                        <ImageGallery images={images} title={product.title} />
                        <SimilarItemsList images={images} />
                    </div>
                </div>

                {/* Right Column: Buy Box & Summary (Span 5) */}
                <div className="md:col-span-5">
                    <ProductPurchaseOptions product={product} />
                    
                    {/* Coupon Section */}
                    <ProductCouponSection coupons={product.activeCoupons} />
                </div>
            </div>

            {/* Explore related items */}
            <RelatedItems relatedProducts={relatedProducts} />

            {/* Bottom Tabs (About this item) */}
            <AboutThisItem product={product} />

            {/* New About this Seller & Feedback Section */}
            <SellerSection product={product} />
        </div>
    );
}
