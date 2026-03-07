import { Link } from 'react-router-dom';
import { ProductCard } from '../../../components/ui/ProductCard';
import { mockProducts } from '../../../lib/mockData';
import { Button } from '../../../components/ui/Button';

export function TodaysDeals() {
    return (
        <section className="mb-16">
            <div className="flex flex-col mb-4">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 m-0 leading-none">Today's Deals</h2>
                        <span className="text-sm text-gray-500 font-medium">All With Free Shipping</span>
                    </div>
                    <Link to="/products?filter=deals" className="text-[#0654ba] hover:underline text-sm font-medium flex items-center gap-1">
                        See all <span className="text-lg leading-none">&rarr;</span>
                    </Link>
                </div>
            </div>

            <div className="flex overflow-x-auto pb-6 gap-3 lg:gap-4 snap-x hide-scrollbar mb-8">
                {mockProducts.map((product) => (
                    <div key={product.id} className="flex flex-col min-w-[160px] max-w-[160px] md:min-w-[210px] md:max-w-[210px] snap-start group pb-2">
                        <div className="relative w-full aspect-square rounded-2xl bg-[#EFEFEF] overflow-hidden mb-3 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow">
                            <button className="absolute top-2 right-2 z-10 w-9 h-9 bg-white/70 hover:bg-white backdrop-blur rounded-full flex items-center justify-center text-gray-900 transition-colors border border-gray-200 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                            </button>
                            <Link to={`/products/${product.id}`} className="block w-full h-full">
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-neutral-800 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                            </Link>
                        </div>

                        <Link to={`/products/${product.id}`} className="flex flex-col flex-grow gap-1">
                            <h3 className="text-[15px] text-[#333] leading-[1.3] line-clamp-2 h-[2.6em] group-hover:underline m-0">
                                {product.title}
                            </h3>
                            <div className="flex flex-wrap items-baseline gap-x-2 mt-1">
                                <span className="font-bold text-[17px] text-gray-900">
                                    ₫{product.price.toLocaleString('en-US')}
                                </span>
                                {product.originalPrice && (
                                    <span className="text-gray-500 text-sm line-through">
                                        ₫{product.originalPrice.toLocaleString('en-US')}
                                    </span>
                                )}
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}
