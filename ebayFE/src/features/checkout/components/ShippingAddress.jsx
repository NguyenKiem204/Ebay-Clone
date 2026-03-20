import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import useAuthStore from '../../../store/useAuthStore';

const COUNTRIES = [
    { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
    { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
    { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
    { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
    { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
    { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
    { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
    { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
];

export default function ShippingAddress({
    guestShipping,
    setGuestShipping,
    onGuestDone,
    savedAddresses,
    setSavedAddresses,
    selectedSavedIdx,
    setSelectedSavedIdx,
    isEditing,
    onEdit,
}) {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const [isAddingNew, setIsAddingNew] = useState(false);

    // ── COLLAPSED VIEW (Done was clicked) ──
    if (!isEditing) {
        // Determine what to display
        let displayAddr = null;
        if (isAuthenticated && savedAddresses?.length > 0) {
            displayAddr = savedAddresses[selectedSavedIdx ?? 0];
        } else if (guestShipping?.firstName) {
            displayAddr = guestShipping;
        }

        return (
            <div className="bg-white p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[18px] font-bold text-gray-900">Ship to</h2>
                    <button onClick={onEdit} className="text-blue-600 hover:underline text-sm font-medium">Change</button>
                </div>
                {displayAddr ? (
                    <div className="text-sm text-gray-700">
                        <p className="font-bold">{displayAddr.firstName} {displayAddr.lastName}</p>
                        {displayAddr.email && <p className="text-gray-500">{displayAddr.email}</p>}
                        <p>{displayAddr.street}{displayAddr.street2 ? `, ${displayAddr.street2}` : ''}</p>
                        <p>{displayAddr.city}, {displayAddr.state} {displayAddr.zip}</p>
                        <p>{displayAddr.country}</p>
                        {displayAddr.phone && <p>{displayAddr.phone}</p>}
                    </div>
                ) : (
                    <p className="text-sm text-red-500">No address provided</p>
                )}
            </div>
        );
    }

    // ── EDITING MODE ──
    // For authenticated users with saved addresses and NOT adding new
    if (isAuthenticated && savedAddresses?.length > 0 && !isAddingNew) {
        return (
            <div className="bg-white p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[18px] font-bold text-gray-900">Ship to</h2>
                    <button
                        onClick={() => {
                            setGuestShipping({ country: 'Vietnam' });
                            setIsAddingNew(true);
                        }}
                        className="text-blue-600 hover:underline text-sm font-medium"
                    >
                        + Add new address
                    </button>
                </div>

                <div className="space-y-3">
                    {savedAddresses.map((addr, idx) => (
                        <label key={idx} className="relative block cursor-pointer group">
                            <input
                                type="radio"
                                name="saved-address"
                                className="peer sr-only"
                                checked={selectedSavedIdx === idx}
                                onChange={() => setSelectedSavedIdx(idx)}
                            />
                            <div className={`p-4 border-2 rounded-lg transition-all ${selectedSavedIdx === idx ? 'border-[#3665f3] bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 text-[14px]">{addr.firstName} {addr.lastName}</span>
                                            {idx === 0 && (
                                                <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">DEFAULT</span>
                                            )}
                                        </div>
                                        <p className="text-[13px] text-gray-600">{addr.street}{addr.street2 ? `, ${addr.street2}` : ''}</p>
                                        <p className="text-[13px] text-gray-600">{addr.city}, {addr.state} {addr.zip}</p>
                                        <p className="text-[13px] text-gray-600">{addr.country}</p>
                                        {addr.phone && <p className="text-[13px] text-gray-500">{addr.phone}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedSavedIdx === idx && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#3665f3]">
                                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>

                <Button
                    onClick={onGuestDone}
                    className="mt-5 bg-[#3665f3] hover:bg-blue-700 rounded-full font-bold text-[15px] px-10 h-11"
                >
                    Ship to this address
                </Button>
            </div>
        );
    }

    // ── FORM MODE (Guest OR User adding new address) ──
    return (
        <ShipToForm
            guestShipping={guestShipping}
            setGuestShipping={setGuestShipping}
            isAuthenticated={isAuthenticated}
            isAddingNew={isAddingNew}
            onCancel={() => setIsAddingNew(false)}
            onDone={(formData) => {
                if (isAuthenticated) {
                    // Save this address to the list
                    const newList = [...(savedAddresses || []), { ...formData }];
                    setSavedAddresses(newList);
                    setSelectedSavedIdx(newList.length - 1);
                    setIsAddingNew(false);
                }
                onGuestDone?.();
            }}
        />
    );
}


// ────────────────────────────────────────────────────────────
// Unified "Ship to" form – used by both Guest and User
// ────────────────────────────────────────────────────────────
function ShipToForm({ guestShipping, setGuestShipping, isAuthenticated, isAddingNew, onCancel, onDone }) {
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const g = guestShipping || {};
    const set = (field, value) => setGuestShipping(prev => ({ ...prev, [field]: value }));
    const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

    const selectedCountry = COUNTRIES.find(c => c.name === g.country) || COUNTRIES[0];

    const validate = () => {
        const errs = {};
        if (!g.email || !/\S+@\S+\.\S+/.test(g.email)) errs.email = 'Enter an email address.';
        if (!g.firstName?.trim()) errs.firstName = 'Enter first name.';
        if (!g.lastName?.trim()) errs.lastName = 'Enter last name.';
        if (!g.street?.trim()) errs.street = 'Enter street address.';
        if (!g.city?.trim()) errs.city = 'Enter city.';
        if (!g.state?.trim()) errs.state = 'Enter state/province.';
        if (!g.zip?.trim()) errs.zip = 'Enter ZIP code.';
        if (!g.phone?.trim()) errs.phone = 'Enter phone number.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleDone = () => {
        setTouched({ email: true, firstName: true, lastName: true, street: true, city: true, state: true, zip: true, phone: true });
        if (validate()) onDone?.(g);
    };

    const inputCls = (field) =>
        `w-full bg-[#f7f7f7] border rounded-lg px-4 pt-5 pb-2 text-[15px] text-gray-900 outline-none transition-colors peer placeholder-transparent focus:border-[#3665f3] focus:ring-1 focus:ring-[#3665f3] ${touched[field] && errors[field] ? 'border-[#e53238]' : 'border-gray-300'}`;

    const labelCls = (field) =>
        `absolute left-4 top-2 text-[11px] font-medium transition-all pointer-events-none ${touched[field] && errors[field] ? 'text-[#e53238]' : 'text-gray-500'}`;

    return (
        <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900">
                    {isAddingNew ? 'Add new address' : 'Ship to'}
                </h2>
                {isAddingNew && (
                    <button onClick={onCancel} className="text-blue-600 hover:underline text-sm font-medium">
                        Cancel
                    </button>
                )}
            </div>

            <div className="space-y-5">
                {/* Email */}
                <div>
                    <div className="relative">
                        <input
                            type="email"
                            value={g.email || ''}
                            onChange={e => set('email', e.target.value)}
                            onBlur={() => { touch('email'); validate(); }}
                            className={inputCls('email')}
                            placeholder="Email"
                        />
                        <label className={labelCls('email')}>Email</label>
                    </div>
                    {touched.email && errors.email && <p className="text-[#e53238] text-[12px] mt-1 font-medium">Error: {errors.email}</p>}
                    <p className="text-[13px] text-gray-500 mt-1">We'll send your order confirmation after checkout.</p>
                </div>

                {/* Country */}
                <div className="relative">
                    <select
                        value={g.country || 'Vietnam'}
                        onChange={e => set('country', e.target.value)}
                        className="w-full bg-[#f7f7f7] border border-gray-300 rounded-lg px-4 pt-5 pb-2 text-[15px] text-gray-900 outline-none appearance-none cursor-pointer focus:border-[#3665f3] focus:ring-1 focus:ring-[#3665f3]"
                    >
                        {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                    </select>
                    <label className="absolute left-4 top-2 text-[11px] text-gray-500 font-medium pointer-events-none">Country or region</label>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </div>
                </div>

                {/* First / Last Name */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={g.firstName || ''}
                            onChange={e => set('firstName', e.target.value)}
                            onBlur={() => { touch('firstName'); validate(); }}
                            className={inputCls('firstName')}
                            placeholder="First name"
                        />
                        <label className={labelCls('firstName')}>First name</label>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={g.lastName || ''}
                            onChange={e => set('lastName', e.target.value)}
                            onBlur={() => { touch('lastName'); validate(); }}
                            className={inputCls('lastName')}
                            placeholder="Last name"
                        />
                        <label className={labelCls('lastName')}>Last name</label>
                    </div>
                </div>

                {/* Street Address */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={g.street || ''}
                            onChange={e => set('street', e.target.value)}
                            onBlur={() => { touch('street'); validate(); }}
                            className={inputCls('street')}
                            placeholder="Street address"
                        />
                        <label className={labelCls('street')}>Street address</label>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={g.street2 || ''}
                            onChange={e => set('street2', e.target.value)}
                            className="w-full bg-[#f7f7f7] border border-gray-300 rounded-lg px-4 pt-5 pb-2 text-[15px] text-gray-900 outline-none focus:border-[#3665f3] focus:ring-1 focus:ring-[#3665f3] placeholder-transparent peer"
                            placeholder="Street address 2"
                        />
                        <label className="absolute left-4 top-2 text-[11px] text-gray-500 font-medium pointer-events-none">Street address 2 (optional)</label>
                    </div>
                </div>

                {/* City / State / ZIP */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={g.city || ''}
                            onChange={e => set('city', e.target.value)}
                            onBlur={() => { touch('city'); validate(); }}
                            className={inputCls('city')}
                            placeholder="City"
                        />
                        <label className={labelCls('city')}>City</label>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={g.state || ''}
                            onChange={e => set('state', e.target.value)}
                            onBlur={() => { touch('state'); validate(); }}
                            className={inputCls('state')}
                            placeholder="State/Province/Region"
                        />
                        <label className={labelCls('state')}>State/Province/Re...</label>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={g.zip || ''}
                            onChange={e => set('zip', e.target.value)}
                            onBlur={() => { touch('zip'); validate(); }}
                            className={inputCls('zip')}
                            placeholder="ZIP code"
                        />
                        <label className={labelCls('zip')}>ZIP code</label>
                    </div>
                </div>

                {/* Phone with country code */}
                <div>
                    <div className="grid grid-cols-[180px_1fr] gap-4">
                        <div className="relative">
                            <select
                                value={selectedCountry.code}
                                onChange={e => {
                                    const c = COUNTRIES.find(ct => ct.code === e.target.value);
                                    if (c) set('country', c.name);
                                }}
                                className="w-full bg-[#f7f7f7] border border-gray-300 rounded-lg px-4 pt-5 pb-2 text-[15px] text-gray-900 outline-none appearance-none cursor-pointer focus:border-[#3665f3] focus:ring-1 focus:ring-[#3665f3]"
                            >
                                {COUNTRIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>
                                ))}
                            </select>
                            <label className="absolute left-4 top-2 text-[11px] text-gray-500 font-medium pointer-events-none">Country Code</label>
                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="tel"
                                value={g.phone || ''}
                                onChange={e => set('phone', e.target.value)}
                                onBlur={() => { touch('phone'); validate(); }}
                                className={inputCls('phone')}
                                placeholder="Phone number (required)"
                            />
                            <label className={labelCls('phone')}>Phone number (required)</label>
                        </div>
                    </div>
                    {touched.phone && errors.phone && <p className="text-[#e53238] text-[12px] mt-1 font-medium">Error: {errors.phone}</p>}
                    <p className="text-[13px] text-gray-500 mt-1">We only use this number if there's a shipping issue.</p>
                </div>

                {/* Done Button */}
                <Button
                    onClick={handleDone}
                    className="bg-[#3665f3] hover:bg-blue-700 rounded-full font-bold text-[15px] px-10 h-11"
                >
                    Done
                </Button>
            </div>
        </div>
    );
}
