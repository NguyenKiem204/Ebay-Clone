import { useState } from 'react';
import { ChevronDown, ChevronRight, User, Shield, MapPin, MessageSquare, History, CreditCard, Settings, ShoppingBag, Heart } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import PersonalInfoView from '../features/auth/components/PersonalInfoView';
import AddressTab from '../features/auth/components/AddressTab';
import SecurityTab from '../features/auth/components/SecurityTab';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'security', 'addresses'
    const [expandedSections, setExpandedSections] = useState(['personal']);

    const toggleSection = (id) => {
        setExpandedSections(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const sidebarItems = [
        {
            id: 'personal',
            label: 'Personal Info',
            icon: <User size={18} />,
            subItems: [
                { id: 'personal', label: 'Personal information' },
                { id: 'security', label: 'Sign in and security' },
                { id: 'addresses', label: 'Addresses' },
                { id: 'feedback', label: 'Feedback' },
            ]
        },
        {
            id: 'payment',
            label: 'Payment Information',
            icon: <CreditCard size={18} />,
            subItems: []
        },
        {
            id: 'preferences',
            label: 'Account preferences',
            icon: <Settings size={18} />,
            subItems: []
        },
        {
            id: 'selling',
            label: 'Selling',
            icon: <ShoppingBag size={18} />,
            subItems: []
        }
    ];

    return (
        <div className="min-h-screen bg-white font-inter">
            {/* Page Header */}
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-8">
                <h1 className="text-[32px] font-bold text-[#333] mb-6">My eBay</h1>
                
                {/* Account Navigation Tabs */}
                <div className="flex border-b border-gray-200 text-[14px]">
                    <button className="px-6 py-3 text-gray-600 hover:text-blue-600 font-medium border-b-2 border-transparent">Activity</button>
                    <button className="px-6 py-3 text-gray-600 hover:text-blue-600 font-medium border-b-2 border-transparent">Messages</button>
                    <button className="px-6 py-3 text-blue-600 font-bold border-b-2 border-blue-600">Account</button>
                </div>
            </div>

            <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex gap-12">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {sidebarItems.map(section => (
                            <div key={section.id} className="border-b border-gray-50 last:border-none pb-2 pt-2">
                                <button 
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between py-2 text-[14px] text-[#333] hover:text-blue-600 transition-colors group"
                                >
                                    <span className={`font-medium ${expandedSections.includes(section.id) ? 'font-bold underline' : ''}`}>
                                        {section.label}
                                    </span>
                                    {section.subItems.length > 0 && (
                                        expandedSections.includes(section.id) 
                                            ? <ChevronDown size={14} className="text-gray-400" /> 
                                            : <ChevronRight size={14} className="text-gray-400" />
                                    )}
                                </button>
                                
                                {expandedSections.includes(section.id) && section.subItems.length > 0 && (
                                    <div className="ml-4 mt-1 space-y-1">
                                        {section.subItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveTab(item.id)}
                                                className={`w-full text-left py-2 px-3 text-[13px] rounded-md transition-all ${
                                                    activeTab === item.id 
                                                    ? 'bg-gray-100 text-[#333] font-bold' 
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-grow min-w-0">
                    <div className="bg-white rounded-lg p-2">
                        {activeTab === 'personal' && <PersonalInfoView setActiveTab={setActiveTab} />}
                        {activeTab === 'addresses' && <AddressTab />}
                        {activeTab === 'security' && <SecurityTab />}
                        {activeTab === 'feedback' && (
                            <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-600">No feedback yet</h3>
                                <p className="text-gray-400">Transactions will appear here after they are completed.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
