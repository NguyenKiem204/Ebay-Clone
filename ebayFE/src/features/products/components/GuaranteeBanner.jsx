import { Link } from 'react-router-dom';

export function GuaranteeBanner() {
    return (
        <section className="mb-12">
            <div className="bg-[#E97600] rounded-2xl flex flex-col md:flex-row items-center justify-between px-6 py-8 md:px-10 md:py-10">
                <div className="flex flex-col gap-2 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold">
                        eBay Money Back Guarantee
                    </h2>
                    <p className="text-base md:text-lg">
                        Get the item you ordered or get your money back, on virtually all items!
                    </p>
                </div>
                <Link
                    to="/guarantee"
                    className="mt-6 md:mt-0 bg-[#000000] text-white font-bold px-8 py-3 rounded-full hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                >
                    Learn more
                </Link>
            </div>
        </section>
    );
}
