import { useState, useEffect } from 'react';
import { Facebook, Twitter, ChevronUp } from 'lucide-react';

const SITES = [
    { name: 'Argentina', code: 'ar' }, { name: 'Australia', code: 'au' }, { name: 'Austria', code: 'at' },
    { name: 'Belarus', code: 'by' }, { name: 'Belgium', code: 'be' }, { name: 'Bolivia', code: 'bo' },
    { name: 'Brazil', code: 'br' }, { name: 'Canada', code: 'ca' }, { name: 'Chile', code: 'cl' },
    { name: 'China', code: 'cn' }, { name: 'Colombia', code: 'co' }, { name: 'Costa Rica', code: 'cr' },
    { name: 'Dominican Republic', code: 'do' }, { name: 'Ecuador', code: 'ec' }, { name: 'El Salvador', code: 'sv' },
    { name: 'France', code: 'fr' }, { name: 'Germany', code: 'de' }, { name: 'Guatemala', code: 'gt' },
    { name: 'Honduras', code: 'hn' }, { name: 'Hong Kong', code: 'hk' }, { name: 'India', code: 'in' },
    { name: 'Ireland', code: 'ie' }, { name: 'Israel', code: 'il' }, { name: 'Italy', code: 'it' },
    { name: 'Japan', code: 'jp' }, { name: 'Kazakhstan', code: 'kz' }, { name: 'Korea', code: 'kr' },
    { name: 'Malaysia', code: 'my' }, { name: 'Mexico', code: 'mx' }, { name: 'Netherlands', code: 'nl' },
    { name: 'New Zealand', code: 'nz' }, { name: 'Nicaragua', code: 'ni' }, { name: 'Panama', code: 'pa' },
    { name: 'Paraguay', code: 'py' }, { name: 'Peru', code: 'pe' }, { name: 'Philippines', code: 'ph' },
    { name: 'Poland', code: 'pl' }, { name: 'Portugal', code: 'pt' }, { name: 'Puerto Rico', code: 'pr' },
    { name: 'Singapore', code: 'sg' }, { name: 'Spain', code: 'es' }, { name: 'Switzerland', code: 'ch' },
    { name: 'Taiwan', code: 'tw' }, { name: 'Turkey', code: 'tr' }, { name: 'United Kingdom', code: 'gb' },
    { name: 'Uruguay', code: 'uy' }, { name: 'Venezuela', code: 've' }
];

export default function Footer() {
    const [showSites, setShowSites] = useState(false);
    const [showScroll, setShowScroll] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScroll(true);
            } else {
                setShowScroll(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <>
            {/* eBay Global Footer Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --color-neutral-100: #ffffff;
                    --color-neutral-200: #f7f7f7;
                    --color-neutral-300: #e5e5e5;
                    --color-neutral-400: #c7c7c7;
                    --color-neutral-500: #8f8f8f;
                    --color-neutral-600: #707070;
                    --color-neutral-700: #363636;
                    --color-neutral-800: #191919;
                    --color-blue-500: #0968f6;
                    --spacing-100: 8px;
                    --spacing-200: 16px;
                    --spacing-300: 24px;
                    --spacing-400: 32px;
                }
                #dp-global-footer {
                    font-family: var(--font-family-market-sans, "Market Sans", Arial, sans-serif);
                    background-color: var(--color-neutral-200);
                    color: var(--color-neutral-600);
                }
                .gh-f-h3 {
                    font-size: 14px;
                    font-weight: bold;
                    color: var(--color-neutral-800);
                    margin-bottom: 12px;
                }
                .gh-f-ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .gh-f-li {
                    margin-bottom: 6px;
                    font-size: 11px;
                }
                .gh-f-a {
                    color: var(--color-neutral-600);
                    text-decoration: none;
                }
                .gh-f-a:hover {
                    text-decoration: underline;
                }
                .gh-f-divider {
                    border-top: 1px solid var(--color-neutral-300);
                    margin-top: 24px;
                    padding-top: 12px;
                }
                .sites-popover {
                    position: absolute;
                    bottom: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    padding: 16px;
                    width: 700px;
                    z-index: 50;
                    /* margin-bottom: 8px; */ /* Removed to bring it closer */
                }
                .sites-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 8px 16px;
                }
                .site-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    color: #666;
                    text-decoration: none;
                }
                .site-item:hover {
                    text-decoration: underline;
                }

                .floating-button {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: white;
                    border: 1px solid #ddd;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #191919;
                }
                .floating-button:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    background: #f8f8f8;
                }
                .help-icon {
            `}} />

            <div className="mt-10 bg-[#f7f7f7] border-t border-[#c7c7c7]">
                <div id="dp-global-footer" className="max-w-[1280px] mx-auto px-4 py-8 page-grid-container homepage-footer">
                    <div id="widget-platform" className="grid grid-cols-2 lg:grid-cols-5 gap-8">

                        {/* Column 1: Buy */}
                        <div className="gh-f-v-m">
                            <h3 className="gh-f-h3">Buy</h3>
                            <ul className="gh-f-ul">
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Registration</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Bidding & buying help</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Stores</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Creator Collections</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">eBay for Charity</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Charity Shop</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Seasonal Sales and events</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">eBay Gift Cards</a></li>
                            </ul>
                        </div>

                        {/* Column 2: Sell & Tools */}
                        <div className="flex flex-col gap-8">
                            <div>
                                <h3 className="gh-f-h3">Sell</h3>
                                <ul className="gh-f-ul">
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">Start selling</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">How to sell</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">Business sellers</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">Affiliates</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="gh-f-h3">Tools & apps</h3>
                                <ul className="gh-f-ul">
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">Developers</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">Security center</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">Site map</a></li>
                                </ul>
                            </div>
                        </div>

                        {/* Column 3: Companies & Stay Connected */}
                        <div className="flex flex-col gap-8">
                            <div>
                                <h3 className="gh-f-h3">eBay companies</h3>
                                <ul className="gh-f-ul">
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">TCGplayer</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="gh-f-h3">Stay connected</h3>
                                <ul className="gh-f-ul">
                                    <li className="gh-f-li">
                                        <a href="#" className="gh-f-a flex items-center gap-2">
                                            <Facebook size={16} /> Facebook
                                        </a>
                                    </li>
                                    <li className="gh-f-li">
                                        <a href="#" className="gh-f-a flex items-center gap-2">
                                            <Twitter size={16} /> X (Twitter)
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Column 4: About eBay */}
                        <div>
                            <h3 className="gh-f-h3">About eBay</h3>
                            <ul className="gh-f-ul">
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Company info</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">News</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Deferred Prosecution Agreement with District of Massachusetts</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Investors</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Careers</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Diversity & Inclusion</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Global Impact</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Government relations</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Advertise with us</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Policies</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Verified Rights Owner (VeRO) Program</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">eCI Licenses</a></li>
                                <li className="gh-f-li"><a href="#" className="gh-f-a">Product Safety Tips</a></li>
                            </ul>
                        </div>

                        {/* Column 5: Help & Community & Sites */}
                        <div className="flex flex-col gap-8">
                            <div>
                                <h3 className="gh-f-h3">Help & Contact</h3>
                                <ul className="gh-f-ul">
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">Seller Center</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">Contact Us</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">eBay Returns</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">eBay Money Back Guarantee</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="gh-f-h3">Community</h3>
                                <ul className="gh-f-ul">
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">Announcements</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">eBay Community</a></li>
                                    <li className="gh-f-li"><a href="#" className="gh-f-a">eBay for Business Podcast</a></li>
                                </ul>
                            </div>
                            <div
                                className="relative"
                                onMouseEnter={() => setShowSites(true)}
                                onMouseLeave={() => setShowSites(false)}
                            >
                                <h3 className="gh-f-h3">eBay Sites</h3>
                                <div
                                    className="flex items-center justify-between border border-[#ccc] px-2 py-1 bg-white cursor-pointer hover:bg-gray-50 min-w-[140px]"
                                >
                                    <div className="flex items-center gap-2">
                                        <img src="https://flagcdn.com/w20/us.png" alt="US" className="w-5 h-3" />
                                        <span className="text-[11px]">United States</span>
                                    </div>
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className={showSites ? "rotate-180" : ""}>
                                        <path d="M1 1L5 5L9 1" stroke="#666" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>

                                {showSites && (
                                    <div className="sites-popover pb-2"> {/* Added pb-2 to bridge any potential gap */}
                                        <div className="sites-grid">
                                            {SITES.map((site) => (
                                                <a key={site.code} href="#" className="site-item">
                                                    <img src={`https://flagcdn.com/w20/${site.code}.png`} alt={site.name} className="w-4 h-2.5" />
                                                    {site.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar Content */}
                    <div className="gh-f-divider text-[10px] text-[#707070] flex flex-wrap items-center gap-x-1 gap-y-1">
                        <p>Copyright © 1995-2024 eBay Inc. All Rights Reserved.</p>
                        <ul className="flex flex-wrap gap-x-1 list-none p-0 m-0">
                            <li><a href="#" className="underline hover:decoration-black">Accessibility</a>,</li>
                            <li><a href="#" className="underline hover:decoration-black">User Agreement</a>,</li>
                            <li><a href="#" className="underline hover:decoration-black">Privacy</a>,</li>
                            <li><a href="#" className="underline hover:decoration-black">Consumer Health Data</a>,</li>
                            <li><a href="#" className="underline hover:decoration-black">Payments Terms of Use</a>,</li>
                            <li><a href="#" className="underline hover:decoration-black">Cookies</a>,</li>
                            <li><a href="#" className="underline hover:decoration-black">CA Privacy Notice</a>,</li>
                            <li className="flex items-center gap-1">
                                <a href="#" className="underline hover:decoration-black">Your Privacy Choices</a>
                                <svg width="26" height="12" viewBox="0 0 38 18" fill="none" className="inline-block">
                                    <path d="M7.5 4.5H23.5C27.5 4.5 30.5 7.5 30.5 11.5C30.5 15.5 27.5 18.5 23.5 18.5H7.5C3.5 18.5 0.5 15.5 0.5 11.5C0.5 7.5 3.5 4.5 7.5 4.5Z" fill="#005ECC" />
                                    <path d="M11.5 11.5C11.5 14.2614 9.26142 16.5 6.5 16.5C3.73858 16.5 1.5 14.2614 1.5 11.5C1.5 8.73858 3.73858 6.5 6.5 6.5C9.26142 6.5 11.5 8.73858 11.5 11.5Z" fill="white" />
                                    <path d="M22.5 11.5L18.5 7.5M22.5 11.5L18.5 15.5M22.5 11.5H12.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </li>
                            <li>and</li>
                            <li className="flex items-center gap-0.5">
                                <a href="#" className="underline hover:decoration-black">AdChoice</a>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline-block mb-0.5">
                                    <circle cx="6" cy="6" r="5.5" stroke="#005ECC" />
                                    <path d="M6 3V6M6 9H6.01" stroke="#005ECC" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
