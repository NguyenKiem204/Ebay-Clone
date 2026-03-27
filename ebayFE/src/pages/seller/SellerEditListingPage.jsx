import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Camera, Check, Clock3, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useProductStore from '../../store/useProductStore';
import useCategoryStore from '../../store/useCategoryStore';
import { resolveMediaUrl } from '../../lib/media';
import {
    AUCTION_DURATION_PRESETS,
    extractApiErrorMessages,
    findAuctionDurationPreset,
    formatAuctionDuration,
    getAuctionDurationParts,
    getAuctionDurationTotalMinutes
} from '../../features/seller/utils/auctionDuration';

function deriveAuctionDurationMinutes(product) {
    if (product?.auctionStartTime && product?.auctionEndTime) {
        const diffMs = new Date(product.auctionEndTime).getTime() - new Date(product.auctionStartTime).getTime();
        if (diffMs > 0) {
            return Math.max(15, Math.round(diffMs / 60000));
        }
    }

    return 10080;
}

export default function SellerEditListingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const { fetchProductById, updateProduct, sellerLoading, currentProduct, loading } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        originalPrice: '',
        categoryId: '',
        condition: 'New',
        brand: '',
        stock: 1,
        shippingFee: 0,
        isAuction: false,
        startingBid: '',
        reservePrice: '',
        buyItNowPrice: '',
        auctionDurationMinutes: 10080
    });
    const [existingImages, setExistingImages] = useState([]);
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [notification, setNotification] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [auctionDurationMode, setAuctionDurationMode] = useState('10080');
    const [customAuctionHours, setCustomAuctionHours] = useState('24');
    const [customAuctionMinutes, setCustomAuctionMinutes] = useState('0');

    useEffect(() => {
        fetchCategories();
        fetchProductById(parseInt(id, 10));
    }, [fetchCategories, fetchProductById, id]);

    useEffect(() => {
        if (currentProduct && !loaded) {
            const durationMinutes = deriveAuctionDurationMinutes(currentProduct);
            const durationParts = getAuctionDurationParts(durationMinutes);

            setFormData({
                title: currentProduct.title || '',
                description: currentProduct.description || '',
                price: currentProduct.price || '',
                originalPrice: currentProduct.originalPrice || '',
                categoryId: currentProduct.categoryId || '',
                condition: currentProduct.condition || 'New',
                brand: currentProduct.brand || '',
                stock: currentProduct.stock || 1,
                shippingFee: currentProduct.shippingFee || 0,
                isAuction: Boolean(currentProduct.isAuction),
                startingBid: currentProduct.startingBid || currentProduct.currentBid || '',
                reservePrice: currentProduct.reservePrice || '',
                buyItNowPrice: currentProduct.buyItNowPrice || '',
                auctionDurationMinutes: durationMinutes
            });
            setExistingImages(Array.isArray(currentProduct.images) ? currentProduct.images : []);
            setAuctionDurationMode(findAuctionDurationPreset(durationMinutes));
            setCustomAuctionHours(durationParts.hours);
            setCustomAuctionMinutes(durationParts.minutes);
            setLoaded(true);
        }
    }, [currentProduct, loaded]);

    useEffect(() => {
        if (auctionDurationMode !== 'custom') {
            setAuctionDurationMode(findAuctionDurationPreset(formData.auctionDurationMinutes));
        }
    }, [auctionDurationMode, formData.auctionDurationMinutes]);

    const flatCategories = useMemo(() => {
        const items = [];
        const walk = (cats, prefix = '') => {
            cats?.forEach((cat) => {
                items.push({ id: cat.id, name: `${prefix}${cat.name}` });
                if (cat.subCategories?.length) {
                    walk(cat.subCategories, `${prefix}${cat.name} > `);
                }
            });
        };
        walk(categories);
        return items;
    }, [categories]);

    const totalImages = existingImages.length + newImageFiles.length;
    const auctionStatus = (currentProduct?.auctionStatus || '').toLowerCase();
    const hasAuctionEnded = ['sold', 'ended', 'reserve_not_met', 'cancelled'].includes(auctionStatus)
        || (currentProduct?.auctionEndTime ? new Date(currentProduct.auctionEndTime) <= new Date() : false);
    const isLiveAuctionLocked = Boolean(currentProduct?.isAuction && !hasAuctionEnded);
    const hasActiveAuctionBids = Boolean((currentProduct?.bidCount || 0) > 0);
    const auctionDurationSummary = useMemo(
        () => formatAuctionDuration(formData.auctionDurationMinutes),
        [formData.auctionDurationMinutes]
    );

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAuctionPresetChange = (value) => {
        setAuctionDurationMode(value);

        if (value === 'custom') {
            const parts = getAuctionDurationParts(formData.auctionDurationMinutes);
            setCustomAuctionHours(parts.hours);
            setCustomAuctionMinutes(parts.minutes);
            return;
        }

        setFormData((prev) => ({
            ...prev,
            auctionDurationMinutes: parseInt(value, 10)
        }));
    };

    const handleAuctionCustomChange = (field, value) => {
        const sanitized = value.replace(/[^\d]/g, '');
        const nextHours = field === 'hours' ? sanitized : customAuctionHours;
        const nextMinutes = field === 'minutes' ? sanitized : customAuctionMinutes;

        if (field === 'hours') {
            setCustomAuctionHours(sanitized);
        } else {
            setCustomAuctionMinutes(sanitized);
        }

        setFormData((prev) => ({
            ...prev,
            auctionDurationMinutes: getAuctionDurationTotalMinutes(nextHours, nextMinutes)
        }));
        setAuctionDurationMode('custom');
    };

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files || []);
        const remainingSlots = Math.max(0, 24 - totalImages);
        const nextFiles = files.slice(0, remainingSlots);

        nextFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews((prev) => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });

        setNewImageFiles((prev) => [...prev, ...nextFiles]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeExistingImage = (index) => {
        setExistingImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    };

    const removeNewImage = (index) => {
        setNewImageFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
        setNewImagePreviews((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    };

    const validateForm = () => {
        if (!formData.title.trim() || formData.title.trim().length < 10) {
            return 'Product title must contain at least 10 characters.';
        }

        if (!formData.categoryId) {
            return 'Please select a category for this listing.';
        }

        if (existingImages.length === 0 && newImageFiles.length === 0) {
            return 'Please keep at least one product image.';
        }

        if (!formData.isAuction && (!formData.price || parseFloat(formData.price) <= 0)) {
            return 'Please enter a valid fixed price.';
        }

        if (formData.isAuction) {
            const startingBid = parseFloat(formData.startingBid);
            const reservePrice = parseFloat(formData.reservePrice);
            const buyItNowPrice = parseFloat(formData.buyItNowPrice);

            if (!startingBid || startingBid <= 0) {
                return 'Please enter a valid starting bid for the auction.';
            }

            if ((parseInt(formData.auctionDurationMinutes, 10) || 0) < 15) {
                return 'Auction duration must be at least 15 minutes.';
            }

            if (formData.reservePrice && reservePrice < startingBid) {
                return 'Reserve price must be greater than or equal to the starting bid.';
            }

            if (formData.buyItNowPrice && buyItNowPrice < startingBid * 1.3) {
                return 'Buy It Now price must be at least 130% of the starting bid.';
            }
        }

        return null;
    };

    const handleSubmit = async () => {
        const validationMessage = validateForm();
        if (validationMessage) {
            setNotification({ type: 'error', message: validationMessage });
            return;
        }

        const data = new FormData();
        const normalizedStock = formData.isAuction ? 1 : (parseInt(formData.stock, 10) || 1);
        const shouldSendAuctionPricingFields = formData.isAuction && !hasActiveAuctionBids;
        const shouldSendAuctionDuration = formData.isAuction && !isLiveAuctionLocked;

        data.append('Title', formData.title);
        data.append('Description', formData.description);
        if (!formData.isAuction) {
            data.append('Price', parseFloat(formData.price) || 0);
        }
        if (formData.originalPrice) data.append('OriginalPrice', parseFloat(formData.originalPrice));
        if (formData.categoryId) data.append('CategoryId', parseInt(formData.categoryId, 10));
        data.append('Condition', formData.condition);
        if (formData.brand) data.append('Brand', formData.brand);
        data.append('Stock', normalizedStock);
        data.append('ShippingFee', parseFloat(formData.shippingFee) || 0);
        data.append('IsAuction', formData.isAuction);

        if (formData.isAuction) {
            if (shouldSendAuctionPricingFields) {
                data.append('StartingBid', parseFloat(formData.startingBid) || 0);
                if (formData.reservePrice) data.append('ReservePrice', parseFloat(formData.reservePrice));
                if (formData.buyItNowPrice) data.append('BuyItNowPrice', parseFloat(formData.buyItNowPrice));
            }

            if (shouldSendAuctionDuration) {
                data.append('AuctionDurationMinutes', parseInt(formData.auctionDurationMinutes, 10) || 0);
            }
        }

        existingImages.forEach((url) => data.append('ExistingImages', url));
        newImageFiles.forEach((file) => data.append('NewImages', file));

        const result = await updateProduct(parseInt(id, 10), data);

        if (result.success) {
            toast.success(result.message || 'Listing updated successfully.');
            navigate('/seller/listings');
            return;
        }

        setNotification({
            type: 'error',
            message: result.error || 'Something went wrong while saving this listing.',
            details: extractApiErrorMessages(result.errors)
        });
    };

    if (loading && !loaded) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 size={32} className="animate-spin text-secondary" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1000px] space-y-8 pb-24">
            <div className="flex items-center justify-between">
                <h2 className="text-[28px] font-bold text-gray-900">Edit listing</h2>
            </div>

            {notification && (
                <div className={`flex items-start gap-3 rounded-lg border p-4 shadow-md ${notification.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'}`}>
                    {notification.type === 'success' ? <Check className="mt-0.5" /> : <AlertCircle className="mt-0.5" />}
                    <div className="flex-grow">
                        <p className="font-bold">{notification.message}</p>
                        {notification.details?.length > 0 && (
                            <ul className="mt-2 list-inside list-disc text-sm opacity-90">
                                {notification.details.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        )}
                    </div>
                    <X size={18} className="cursor-pointer opacity-60 hover:opacity-100" onClick={() => setNotification(null)} />
                </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Photos</h3>
                    <span className="text-xs text-gray-500">{totalImages} / 24 photos</span>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-secondary/30 bg-blue-50/10 transition-colors hover:border-secondary"
                    >
                        <div className="flex h-full flex-col items-center justify-center gap-2">
                            <Plus className="text-secondary" />
                            <span className="text-[10px] font-bold text-secondary">Add photos</span>
                        </div>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

                    {existingImages.map((url, index) => (
                        <div key={`existing-${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                            <img src={resolveMediaUrl(url)} alt={`Existing ${index + 1}`} className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                            >
                                <X size={14} />
                            </button>
                            {index === 0 && totalImages > 0 && (
                                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">COVER</span>
                            )}
                        </div>
                    ))}

                    {newImagePreviews.map((src, index) => (
                        <div key={`new-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border-2 border-green-300">
                            <img src={src} alt={`New ${index + 1}`} className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                            >
                                <X size={14} />
                            </button>
                            <span className="absolute bottom-1 left-1 rounded bg-green-600/80 px-1.5 py-0.5 text-[9px] font-bold text-white">NEW</span>
                        </div>
                    ))}

                    {[...Array(Math.max(0, 3 - totalImages))].map((_, index) => (
                        <div key={`placeholder-${index}`} className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/30">
                            <Camera className="text-gray-200" size={20} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-8 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Title <span className="text-red-500">*</span></h3>
                        <span className="text-xs font-medium text-gray-500">{formData.title.length} / 80</span>
                    </div>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        maxLength={80}
                        placeholder="Brand, model, color, and key details"
                        className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    />
                </div>

                <div>
                    <h3 className="mb-4 text-xl font-bold text-gray-900">Category</h3>
                    <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-secondary"
                    >
                        <option value="">Select a category</option>
                        {flatCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="mb-2 text-xl font-bold text-gray-900">Item specifics</h3>
                <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Condition</label>
                        <select
                            name="condition"
                            value={formData.condition}
                            onChange={handleInputChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-secondary"
                        >
                            <option value="New">New</option>
                            <option value="Used - Like New">Used - Like New</option>
                            <option value="Used - Good">Used - Good</option>
                            <option value="Used - Fair">Used - Fair</option>
                            <option value="Refurbished">Refurbished</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Brand</label>
                        <input
                            type="text"
                            name="brand"
                            value={formData.brand}
                            onChange={handleInputChange}
                            placeholder="e.g. Apple"
                            className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-secondary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Stock quantity</label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            min={1}
                            disabled={formData.isAuction}
                            className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-secondary disabled:bg-gray-100"
                        />
                        {formData.isAuction && (
                            <p className="text-[11px] text-gray-400">Auction listings support quantity = 1 only.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-8">
                    <h3 className="text-xl font-bold text-gray-900">Description</h3>
                </div>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="min-h-[200px] w-full p-8 text-gray-800 outline-none placeholder:text-gray-300"
                    placeholder="Tell buyers about the item condition, included accessories, and anything they should know."
                />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="mb-8 text-xl font-bold text-gray-900">Pricing</h3>
                <div className="mb-10 flex gap-8">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="radio"
                            name="pricingType"
                            checked={!formData.isAuction}
                            disabled={isLiveAuctionLocked}
                            onChange={() => setFormData((prev) => ({ ...prev, isAuction: false }))}
                            className="h-5 w-5 cursor-pointer border-gray-300 text-secondary"
                        />
                        <span className={`font-bold ${!formData.isAuction ? 'text-gray-900' : 'text-gray-500'}`}>Fixed price</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="radio"
                            name="pricingType"
                            checked={formData.isAuction}
                            disabled={isLiveAuctionLocked}
                            onChange={() => setFormData((prev) => ({ ...prev, isAuction: true, stock: 1 }))}
                            className="h-5 w-5 cursor-pointer border-gray-300 text-secondary"
                        />
                        <span className={`font-bold ${formData.isAuction ? 'text-gray-900' : 'text-gray-500'}`}>Auction</span>
                    </label>
                </div>

                {isLiveAuctionLocked && (
                    <p className="mb-6 text-sm text-amber-700">
                        This auction is already live. Format and duration are locked until the auction ends.
                    </p>
                )}

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {!formData.isAuction ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Price <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="w-full rounded-md border border-gray-300 py-3 pl-8 pr-4 font-bold text-gray-900 outline-none focus:border-secondary"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Original price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="originalPrice"
                                        value={formData.originalPrice}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="w-full rounded-md border border-gray-300 py-3 pl-8 pr-4 text-gray-900 outline-none focus:border-secondary"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Starting bid</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="startingBid"
                                        value={formData.startingBid}
                                        onChange={handleInputChange}
                                        disabled={hasActiveAuctionBids}
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="w-full rounded-md border border-gray-300 py-3 pl-8 pr-4 font-bold text-gray-900 outline-none focus:border-secondary disabled:bg-gray-100"
                                    />
                                </div>
                                {hasActiveAuctionBids && (
                                    <p className="text-[11px] text-gray-400">Starting bid is locked after the first bid.</p>
                                )}
                            </div>

                            <div className="space-y-4 md:col-span-2">
                                <div className="flex items-center gap-2">
                                    <Clock3 size={16} className="text-secondary" />
                                    <label className="text-sm font-medium text-gray-700">Auction duration</label>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                                    {AUCTION_DURATION_PRESETS.map((preset) => (
                                        <button
                                            key={preset.minutes}
                                            type="button"
                                            onClick={() => handleAuctionPresetChange(String(preset.minutes))}
                                            disabled={isLiveAuctionLocked}
                                            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                                                auctionDurationMode === String(preset.minutes)
                                                    ? 'border-secondary bg-blue-50 text-secondary shadow-sm'
                                                    : 'border-gray-200 text-gray-600 hover:border-secondary/40 hover:bg-gray-50'
                                            } disabled:cursor-not-allowed disabled:opacity-60`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => handleAuctionPresetChange('custom')}
                                        disabled={isLiveAuctionLocked}
                                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                                            auctionDurationMode === 'custom'
                                                ? 'border-secondary bg-blue-50 text-secondary shadow-sm'
                                                : 'border-gray-200 text-gray-600 hover:border-secondary/40 hover:bg-gray-50'
                                        } disabled:cursor-not-allowed disabled:opacity-60`}
                                    >
                                        Custom
                                    </button>
                                </div>

                                {auctionDurationMode === 'custom' && (
                                    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Hours</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={customAuctionHours}
                                                onChange={(event) => handleAuctionCustomChange('hours', event.target.value)}
                                                disabled={isLiveAuctionLocked}
                                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-secondary disabled:bg-gray-100"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Minutes</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                step="1"
                                                value={customAuctionMinutes}
                                                onChange={(event) => handleAuctionCustomChange('minutes', event.target.value)}
                                                disabled={isLiveAuctionLocked}
                                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-secondary disabled:bg-gray-100"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-gray-700">
                                    <p className="font-semibold text-gray-900">Ends in {auctionDurationSummary}</p>
                                    <p className="mt-1 text-xs text-gray-500">This edit form now matches the create listing auction flow.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Reserve price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="reservePrice"
                                        value={formData.reservePrice}
                                        onChange={handleInputChange}
                                        disabled={hasActiveAuctionBids}
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="w-full rounded-md border border-gray-300 py-3 pl-8 pr-4 text-gray-900 outline-none focus:border-secondary disabled:bg-gray-100"
                                    />
                                </div>
                                {hasActiveAuctionBids && (
                                    <p className="text-[11px] text-gray-400">Reserve price is locked after the first bid.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Buy It Now price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="buyItNowPrice"
                                        value={formData.buyItNowPrice}
                                        onChange={handleInputChange}
                                        disabled={hasActiveAuctionBids}
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="w-full rounded-md border border-gray-300 py-3 pl-8 pr-4 text-gray-900 outline-none focus:border-secondary disabled:bg-gray-100"
                                    />
                                </div>
                                {hasActiveAuctionBids && (
                                    <p className="text-[11px] text-gray-400">Buy It Now is locked after the first bid.</p>
                                )}
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Shipping fee</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">$</span>
                            <input
                                type="number"
                                name="shippingFee"
                                value={formData.shippingFee}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full rounded-md border border-gray-300 py-3 pl-8 pr-4 text-gray-900 outline-none focus:border-secondary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white py-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="mx-auto flex max-w-[1000px] items-center justify-end gap-6 px-4">
                    <button onClick={() => navigate('/seller/listings')} className="text-sm font-bold text-secondary hover:underline">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={sellerLoading}
                        className="flex items-center gap-2 rounded-full bg-secondary px-10 py-2.5 font-bold text-white shadow-lg shadow-secondary/10 transition-all hover:bg-blue-700 disabled:opacity-50"
                    >
                        {sellerLoading && <Loader2 size={16} className="animate-spin" />}
                        Save changes
                    </button>
                </div>
            </div>
        </div>
    );
}
