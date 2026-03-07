import { Link } from 'react-router-dom';
import { Button } from './Button';

export function ProductCard({ product }) {
    return (
        <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-shadow">
            {product.discount > 0 && (
                <div className="absolute top-2 left-2 z-10 bg-primary leading-none text-white text-xs font-bold px-2 py-1 rounded">
                    {product.discount}% OFF
                </div>
            )}
            <button className="absolute top-2 right-2 z-10 p-2 text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            </button>

            <Link to={`/products/${product.id}`} className="block relative pt-[100%] overflow-hidden bg-gray-50">
                <img
                    src={product.image}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                />
            </Link>

            <div className="p-4 flex flex-col flex-grow">
                <Link to={`/products/${product.id}`} className="text-sm font-medium text-gray-800 line-clamp-2 hover:underline mb-1 flex-grow">
                    {product.title}
                </Link>
                <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-yellow-400 text-xs">
                        {'★'.repeat(Math.round(product.rating))}
                        {'☆'.repeat(5 - Math.round(product.rating))}
                    </div>
                    <span className="text-xs text-gray-500">({product.reviews})</span>
                </div>

                <div className="mt-auto">
                    <div className="text-lg font-bold text-gray-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
                    </div>
                    {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-gray-500 line-through">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.originalPrice)}
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs">
                        {product.isFreeShipping && <span className="text-green-600 font-medium">Free shipping</span>}
                        <span className="text-gray-400">From {product.seller}</span>
                    </div>
                </div>

                <div className="mt-3 overflow-hidden h-0 group-hover:h-10 transition-all opacity-0 group-hover:opacity-100">
                    <Button className="w-full text-sm font-bold" variant="secondary">Add to cart</Button>
                </div>
            </div>
        </div>
    );
}
