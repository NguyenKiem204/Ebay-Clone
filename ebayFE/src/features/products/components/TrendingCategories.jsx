import { Link } from 'react-router-dom';
import { mockTrending } from '../../../lib/mockData';

export function TrendingCategories({ title = "Trending on eBay", data = mockTrending }) {
    return (
        <section className="mb-12 cursor-pointer">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{title}</h2>

            <div className="flex overflow-x-auto pb-6 gap-4 hide-scrollbar snap-x">
                {data.map((category) => (
                    <Link
                        key={category.id}
                        to={`/products?category=${category.slug}`}
                        className="flex flex-col flex-shrink-0 min-w-[120px] max-w-[120px] md:min-w-[160px] md:max-w-[160px] snap-start group text-gray-900 hover:text-gray-900"
                    >
                        <div className="w-full aspect-square rounded-xl bg-[#EFEFEF] overflow-hidden mb-3 relative group-hover:shadow-md transition-shadow">
                            <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-neutral-800 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        <h3 className="text-center text-[15px] leading-tight font-medium group-hover:underline m-0 line-clamp-2">
                            {category.name}
                        </h3>
                    </Link>
                ))}
            </div>
        </section>
    );
}
