import { Link } from 'react-router-dom';
import { mockCategories } from '../../../lib/mockData';

export function FeaturedCategories({ categories = [] }) {
    if (!categories || categories.length === 0) return null;

    return (
        <section className="mb-12 w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">The future in your hands Code moi nhat</h2>
            <div className="flex md:grid md:grid-cols-7 overflow-x-auto pb-6 gap-4 lg:gap-4 xl:gap-6 snap-x w-full">
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        to={`/products?category=${cat.slug}`}
                        className="flex flex-col gap-3 min-w-[140px] max-w-[140px] md:min-w-0 md:max-w-none md:w-full snap-start group"
                    >
                        <div className="w-full aspect-square rounded-2xl bg-[#EFEFEF] overflow-hidden relative group-hover:shadow-sm transition-shadow">
                            <img
                                src={cat.imageUrl || cat.iconUrl}
                                alt={cat.name}
                                className="absolute inset-0 w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <span className="text-[15px] text-gray-800 leading-snug break-words">
                            {cat.name}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
