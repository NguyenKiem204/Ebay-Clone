import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export function PromoBanners() {
    return (
        <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#F4F6FB] rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden">
                    <div className="relative z-10 max-w-[50%]">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Spring Refresh</h3>
                        <p className="text-gray-600 mb-6 w-full max-w-[200px]">Up to 60% off home and garden essentials to get your space ready.</p>
                        <Button as={Link} to="/products?category=home-decor" variant="outline" className="bg-white border-gray-900 text-gray-900 font-bold hover:bg-gray-50 px-6">
                            Shop now
                        </Button>
                    </div>
                    <div className="w-[180px] h-[180px] sm:absolute right-8 top-1/2 sm:-translate-y-1/2 drop-shadow-xl mt-6 sm:mt-0">
                        <img
                            src="https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=400"
                            alt="Spring promo"
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    </div>
                </div>

                <div className="bg-[#FFF8F0] rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden">
                    <div className="relative z-10 max-w-[50%]">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Tech Event</h3>
                        <p className="text-gray-600 mb-6 w-full max-w-[200px]">Unbeatable prices on the latest laptops, tablets, and gaming gear.</p>
                        <Button as={Link} to="/products?category=electronics" variant="outline" className="bg-white border-gray-900 text-gray-900 font-bold hover:bg-gray-50 px-6">
                            Explore deals
                        </Button>
                    </div>
                    <div className="w-[180px] h-[180px] sm:absolute right-8 top-1/2 sm:-translate-y-1/2 drop-shadow-xl mt-6 sm:mt-0">
                        <img
                            src="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=400"
                            alt="Tech promo"
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
