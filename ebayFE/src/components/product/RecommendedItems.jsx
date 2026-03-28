import { Link } from 'react-router-dom';
import useCurrencyStore from '../../store/useCurrencyStore';

export function RecommendedItems({ recommendations }) {
    const formatPrice = useCurrencyStore(s => s.formatPrice);
    if (!recommendations || recommendations.length === 0) return null;

    return (
        <section className="mt-12 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Because you viewed this...</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {recommendations.map((product) => (
                    <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        className="flex flex-col group"
                    >
                        <div className="relative w-full aspect-square rounded-xl bg-[#F4F4F4] overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
                            {product.thumbnail ? (
                                <img
                                    src={product.thumbnail}
                                    alt={product.title}
                                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 p-2"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200 text-3xl">Ã°Å¸â€œÂ¦</div>
                            )}
                        </div>
                        <p className="text-[13px] text-[#333] line-clamp-2 leading-tight group-hover:underline">
                            {product.title}
                        </p>
                        <p className="text-[14px] font-bold text-gray-900 mt-1">
                            {formatPrice(Number(product.price || 0))}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
