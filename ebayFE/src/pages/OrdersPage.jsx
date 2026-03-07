import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState('All');

    const tabs = ['All', 'Unpaid', 'Returns', 'Cancelled'];

    const mockOrders = [
        {
            id: "EB-992104521",
            date: "May 15, 2024",
            total: 1099.00,
            recipient: "Nguyen Van A",
            status: "In transit",
            statusText: "In transit - Expected delivery Friday",
            statusColor: "text-orange-500",
            icon: "local_shipping",
            items: [
                {
                    id: 1,
                    title: "iPhone 15 Pro Max 256GB - Blue Titanium - Unlocked",
                    seller: "TechShop_Official",
                    qty: 1,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw0TFoh1Qa0vo6wpYMFDVbRgmi6hPz2VCIPLWbKd55DJU5Q3OjIb3yPjL9-KHkDU9-s-RfOprNIzf4wmeUTkv_729y9sPomxMSMtSBZaxpe2tF1VLUHYHRg5-DKFO6fNJ7tBgDh1-04NlE5ilH-RHl1yCkJHgVa5JHuWDGzvibAYtb8htA97gdd681nWS-0ztVE9J2LMexZ6O8MplTzN5vyOgnwtIHN_Arq0Ilo7woXqg3c-YR_6qj814DlPx-Yvvx4qw9UsCSyUY"
                }
            ]
        },
        {
            id: "EB-881023194",
            date: "May 10, 2024",
            total: 125.00,
            recipient: "Nguyen Van A",
            status: "Delivered",
            statusText: "Delivered on May 12, 2024",
            statusColor: "text-green-600",
            icon: "check_circle",
            items: [
                {
                    id: 2,
                    title: "Men's Performance Sneakers - White/Silver - Size 9",
                    seller: "FashionStore",
                    qty: 1,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAR2FmtYxkhMuqhj1nzAI74rh9IJ5ITbd9ZjLhzmQI5J4KXe5yBPUotrBNvqYjS7e9HYG-M4oUKB_lnByMWxxhPmhUeUMM_Stz88RDmTLsOHPup-0MQfKdEAXHqo0FwOEeTRowjQB9v8KzGf2OB9VtDvfujfVylnqVXAtfWv2CzGlf6qPeiTLuuqrZ0H_40__HzV106tds_z3yvgsn3WtrqmPbBhQ8tKPzT_u8uF4cg_Mt3spyYoOQVrL8sUg964Z8ySfCENVkXz9A"
                }
            ]
        },
        {
            id: "EB-771239012",
            date: "May 02, 2024",
            total: 45.00,
            recipient: "Nguyen Van A",
            status: "Cancelled",
            statusText: "Cancelled by buyer",
            statusColor: "text-red-600",
            icon: "cancel",
            items: [
                {
                    id: 3,
                    title: "Nordic Style Decorative Ceramic Vase - Size M",
                    seller: "HomeDecor",
                    qty: 2,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCld-10esDIGuS0Vt2iO-ay-UABqSiG_bWH7GqcUGWgIL_gxW_IvWQWBxWMxO3n0ziI5YdwfvPnuTgdCGdRFMBLqkps6uFn-zEIG_kh538bE_7nFTdSH9hAXTDJJJoNnZRFhsoIhhJgMf9rCCbP7JvO3y8TO4usN4Cto7qzCwMIm_bvUTg2NgBMjogsTZDvSrooFhk89Y8rFSrdWxy6U1O_vNmCjSu2gCYU9CLBkcdoWj9Wkrh7iu745nYi_joxXE6XcDryOM4xGWI"
                }
            ]
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-[1400px]">
            <div className="flex flex-col md:flex-row gap-8 min-h-screen">

                {/* Sidebar Nav */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-24">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h2 className="font-bold text-xl text-gray-900">My eBay</h2>
                        </div>
                        <nav className="flex flex-col py-2">
                            <Link to="/profile" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                                Profile
                            </Link>
                            <Link to="/orders" className="flex items-center px-6 py-3 text-secondary bg-blue-50/50 border-l-4 border-secondary font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                                Purchase History
                            </Link>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <button className="w-full flex items-center px-6 py-3 text-red-600 hover:bg-gray-50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-2xl font-bold mb-6 text-gray-900">Purchase History</h1>
                        <div className="flex space-x-8 text-sm text-gray-600 border-b border-gray-200">
                            {tabs.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={`pb-3 border-b-2 font-medium transition-colors ${activeTab === t
                                            ? 'border-secondary text-secondary'
                                            : 'border-transparent hover:text-gray-900'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-80 focus:ring-secondary focus:border-secondary outline-none"
                                    placeholder="Search by order ID or seller"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 absolute left-3 top-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <select className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:ring-secondary focus:border-secondary outline-none bg-white">
                                <option>Last 6 months</option>
                                <option>Year 2024</option>
                                <option>Year 2023</option>
                            </select>
                        </div>
                        <div className="text-sm text-gray-500">
                            Showing 1-3 of 3 orders
                        </div>
                    </div>

                    <div className="flex-1 p-6 space-y-6 bg-gray-50/50">
                        {mockOrders.map((order) => (
                            <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                        <div>
                                            <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">Order Date</p>
                                            <p className="text-sm font-medium text-gray-900">{order.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total)}
                                            </p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">Recipient</p>
                                            <p className="text-sm font-medium text-gray-900">{order.recipient}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">Order #</p>
                                        <p className="text-sm font-medium text-secondary">{order.id}</p>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex gap-4">
                                                <div className={`w-24 h-24 border border-gray-200 rounded-md overflow-hidden flex-shrink-0 bg-white ${order.status === 'Cancelled' ? 'grayscale opacity-75' : ''}`}>
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                                                </div>
                                                <div>
                                                    <Link to="/products/1" className={`font-semibold text-base hover:underline line-clamp-2 leading-tight mb-2 ${order.status === 'Cancelled' ? 'text-gray-600' : 'text-blue-700'}`}>
                                                        {item.title}
                                                    </Link>
                                                    <p className="text-sm text-gray-500">Seller: <span className="font-medium text-gray-800">{item.seller}</span></p>
                                                    <p className="text-sm text-gray-500 mt-1">Quantity: {item.qty}</p>

                                                    <div className={`mt-3 flex items-center text-xs font-semibold ${order.statusColor}`}>
                                                        <span className="material-symbols-outlined text-base mr-1">{order.icon}</span>
                                                        {order.statusText}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col space-y-2 w-full sm:w-48 shrink-0 mt-4 sm:mt-0">
                                                {order.status === 'In transit' && (
                                                    <button className="w-full bg-secondary text-white py-2 px-4 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm">Track package</button>
                                                )}
                                                {order.status === 'Delivered' && (
                                                    <button className="w-full bg-secondary text-white py-2 px-4 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm">Buy again</button>
                                                )}
                                                <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors">View order details</button>
                                                {order.status === 'Delivered' && (
                                                    <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors">Write a review</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
