import { Link } from 'react-router-dom';

export function MotorsPromoBanner() {
    return (
        <section className="mb-12">
            <div className="bg-[#0064D2] rounded-[24px] overflow-hidden flex flex-col lg:flex-row min-h-[360px] text-white">
                {/* Text Content */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight max-w-[400px]">
                        More choice, on and off the road
                    </h2>
                    <p className="text-lg mb-8 max-w-[450px]">
                        Get where you need to go with the right parts and accessories.
                    </p>
                    <div>
                        <Link
                            to="/products"
                            className="inline-block bg-white text-[#0064D2] font-bold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors text-base cursor-pointer"
                        >
                            Explore offers
                        </Link>
                    </div>
                    <div className="mt-8 md:mt-auto">
                        <Link to="#" className="text-sm underline hover:opacity-80 transition-opacity">
                            Discounts in USD. *See terms.
                        </Link>
                    </div>
                </div>

                {/* Decoration/Image Area */}
                <div className="flex-1 relative flex items-center justify-center bg-[#0064D2] overflow-hidden">
                    <div className="w-full h-full min-h-[300px] lg:min-h-full">
                        <img
                            src="https://i.ebayimg.com/images/g/3LsAAeSw5YFpndf6/s-l960.webp"
                            alt="Motors Parts"
                            className="w-full h-full object-cover lg:object-left"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
