import { Link } from 'react-router-dom';

export function MainPromoBanner() {
    return (
        <section className="mb-12">
            <div className="bg-[#A066EE] rounded-[24px] overflow-hidden flex flex-col md:flex-row min-h-[360px]">
                {/* Text Content Area */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center text-white">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight max-w-[400px]">
                        Let the trends follow you
                    </h2>
                    <p className="text-lg mb-8 max-w-[450px]">
                        Enjoy up to $140* off luxury pieces that will always turn heads.
                    </p>
                    <div>
                        <Link
                            to="/products"
                            className="inline-block bg-[#191919] text-white font-bold px-8 py-3 rounded-full hover:bg-black transition-colors text-base cursor-pointer"
                        >
                            Claim your classics
                        </Link>
                    </div>
                    <div className="mt-8 md:mt-auto">
                        <Link to="#" className="text-sm underline hover:opacity-80 transition-opacity cursor-pointer">
                            Discounts in USD. *See terms.
                        </Link>
                    </div>
                </div>

                {/* Image Area */}
                <div className="flex-1 relative flex items-center justify-center bg-[#A066EE] overflow-hidden">
                    <div className="w-full h-full min-h-[300px] md:min-h-full">
                        <img
                            src="https://i.ebayimg.com/images/g/~ToAAeSwP2VpoCtQ/s-l960.webp"
                            alt="Luxury pieces"
                            className="w-full h-full object-cover object-left"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
