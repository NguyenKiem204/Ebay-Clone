import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Camera, Loader2, Check, AlertCircle } from 'lucide-react';
import useProductStore from '../../store/useProductStore';
import useCategoryStore from '../../store/useCategoryStore';
import { BASE_URL } from '../../lib/axios';
import toast from 'react-hot-toast';

export default function SellerEditListingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchProductById, updateProduct, sellerLoading, currentProduct, loading } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();
    const fileInputRef = useRef(null);

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
        auctionDurationDays: 7,
    });

    const [existingImages, setExistingImages] = useState([]); // URLs from server
    const [newImageFiles, setNewImageFiles] = useState([]); // New File objects
    const [newImagePreviews, setNewImagePreviews] = useState([]); // Previews for new files
    const [notification, setNotification] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchProductById(parseInt(id));
    }, [id]);

    // Populate form when product loads
    useEffect(() => {
        if (currentProduct && !loaded) {
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
                isAuction: currentProduct.isAuction || false,
                startingBid: currentProduct.currentBid || '',
                auctionDurationDays: 7,
            });
            setExistingImages(currentProduct.images || []);
            setLoaded(true);
        }
    }, [currentProduct, loaded]);

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${BASE_URL}${cleanUrl}`;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const totalCurrent = existingImages.length + newImageFiles.length;
        const remainingSlots = 24 - totalCurrent;
        const newFiles = files.slice(0, remainingSlots);

        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });

        setNewImageFiles(prev => [...prev, ...newFiles]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setNotification({ type: 'error', message: 'Vui lòng nhập tiêu đề sản phẩm' });
            return;
        }
        if (!formData.isAuction && (!formData.price || parseFloat(formData.price) <= 0)) {
            setNotification({ type: 'error', message: 'Vui lòng nhập giá sản phẩm hợp lệ' });
            return;
        }
        if (existingImages.length === 0 && newImageFiles.length === 0) {
            setNotification({ type: 'error', message: 'Sản phẩm cần có ít nhất 1 ảnh' });
            return;
        }

        const data = new FormData();
        data.append('Title', formData.title);
        data.append('Description', formData.description);
        data.append('Price', parseFloat(formData.price) || 0);
        if (formData.originalPrice) data.append('OriginalPrice', parseFloat(formData.originalPrice));
        if (formData.categoryId) data.append('CategoryId', parseInt(formData.categoryId));
        data.append('Condition', formData.condition);
        if (formData.brand) data.append('Brand', formData.brand);
        data.append('Stock', parseInt(formData.stock) || 1);
        data.append('ShippingFee', parseFloat(formData.shippingFee) || 0);
        data.append('IsAuction', formData.isAuction);
        if (formData.isAuction) {
            data.append('StartingBid', parseFloat(formData.startingBid) || 0);
            data.append('AuctionDurationDays', parseInt(formData.auctionDurationDays));
        }

        // Existing images to keep
        existingImages.forEach(url => {
            data.append('ExistingImages', url);
        });

        // New images
        newImageFiles.forEach(file => {
            data.append('NewImages', file);
        });

        const result = await updateProduct(parseInt(id), data);
        if (result.success) {
            toast.success(result.message || 'Cập nhật sản phẩm thành công!');
            navigate('/seller/listings');
        } else {
            setNotification({
                type: 'error',
                message: result.error || 'Có lỗi xảy ra',
                details: result.errors
            });
        }
    };

    // Flatten categories
    const flatCategories = [];
    const flatten = (cats, prefix = '') => {
        cats?.forEach(cat => {
            flatCategories.push({ id: cat.id, name: prefix + cat.name });
            if (cat.subCategories?.length) flatten(cat.subCategories, prefix + cat.name + ' > ');
        });
    };
    flatten(categories);

    const totalImages = existingImages.length + newImageFiles.length;

    if (loading && !loaded) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 size={32} className="animate-spin text-secondary" />
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 pb-24">
            <div className="flex justify-between items-center">
                <h2 className="text-[28px] font-bold text-gray-900">Edit listing</h2>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-lg flex items-start gap-3 shadow-md border ${notification.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {notification.type === 'success' ? <Check className="mt-0.5" /> : <AlertCircle className="mt-0.5" />}
                    <div className="flex-grow">
                        <p className="font-bold">{notification.message}</p>
                        {notification.details?.length > 0 && (
                            <ul className="mt-2 list-disc list-inside text-sm opacity-90">
                                {notification.details.map((err, idx) => <li key={idx}>{err}</li>)}
                            </ul>
                        )}
                    </div>
                    <X size={18} className="cursor-pointer opacity-60 hover:opacity-100" onClick={() => setNotification(null)} />
                </div>
            )}

            {/* Photos Section */}
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Photos</h3>
                    <span className="text-xs text-gray-500">{totalImages} / 24 photos</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-secondary/30 rounded-lg flex flex-col items-center justify-center gap-2 group hover:border-secondary transition-colors bg-blue-50/10"
                    >
                        <Plus className="text-secondary" />
                        <span className="text-[10px] font-bold text-secondary">Add photos</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

                    {/* Existing images */}
                    {existingImages.map((url, i) => (
                        <div key={`existing-${i}`} className="aspect-square rounded-lg overflow-hidden relative group border border-gray-200">
                            <img src={getImageUrl(url)} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                                onClick={() => removeExistingImage(i)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                <X size={14} />
                            </button>
                            {i === 0 && existingImages.length > 0 && newImageFiles.length === 0 && (
                                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">COVER</span>
                            )}
                        </div>
                    ))}

                    {/* New image previews */}
                    {newImagePreviews.map((src, i) => (
                        <div key={`new-${i}`} className="aspect-square rounded-lg overflow-hidden relative group border-2 border-green-300">
                            <img src={src} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                                onClick={() => removeNewImage(i)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                <X size={14} />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-green-600/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">NEW</span>
                        </div>
                    ))}

                    {[...Array(Math.max(0, 3 - totalImages))].map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square border border-gray-200 border-dashed rounded-lg bg-gray-50/30 flex items-center justify-center">
                            <Camera className="text-gray-200" size={20} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Title & Category */}
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Title <span className="text-red-500">*</span></h3>
                        <span className="text-xs text-gray-500 font-medium">{formData.title.length} / 80</span>
                    </div>
                    <input
                        type="text" name="title" value={formData.title} onChange={handleInputChange} maxLength={80}
                        placeholder="Brand, model, color, size, etc."
                        className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                    />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Category</h3>
                    <select name="categoryId" value={formData.categoryId} onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary">
                        <option value="">Select a category</option>
                        {flatCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Item Specifics */}
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Item specifics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Condition</label>
                        <select name="condition" value={formData.condition} onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary">
                            <option value="New">New</option>
                            <option value="Used - Like New">Used - Like New</option>
                            <option value="Used - Good">Used - Good</option>
                            <option value="Used - Fair">Used - Fair</option>
                            <option value="Refurbished">Refurbished</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Brand</label>
                        <input type="text" name="brand" value={formData.brand} onChange={handleInputChange}
                            placeholder="e.g. Nike" className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Stock quantity</label>
                        <input type="number" name="stock" value={formData.stock} onChange={handleInputChange}
                            min={1} className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary" />
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">Description</h3>
                </div>
                <textarea name="description" value={formData.description} onChange={handleInputChange}
                    className="w-full min-h-[200px] p-8 outline-none text-gray-800 placeholder-gray-300"
                    placeholder="Tell buyers about your item..."></textarea>
            </div>

            {/* Pricing */}
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-8">Pricing</h3>
                <div className="flex gap-8 mb-10">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="pricingType" checked={!formData.isAuction}
                            onChange={() => setFormData(prev => ({ ...prev, isAuction: false }))}
                            className="w-5 h-5 text-secondary border-gray-300 cursor-pointer" />
                        <span className={`font-bold ${!formData.isAuction ? 'text-gray-900' : 'text-gray-500'}`}>Fixed price</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="pricingType" checked={formData.isAuction}
                            onChange={() => setFormData(prev => ({ ...prev, isAuction: true }))}
                            className="w-5 h-5 text-secondary border-gray-300 cursor-pointer" />
                        <span className={`font-bold ${formData.isAuction ? 'text-gray-900' : 'text-gray-500'}`}>Auction</span>
                    </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {!formData.isAuction ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Price <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input type="number" name="price" value={formData.price} onChange={handleInputChange}
                                        step="0.01" min="0" placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md outline-none focus:border-secondary font-bold text-gray-900" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Original price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange}
                                        step="0.01" min="0" placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md outline-none focus:border-secondary text-gray-900" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Starting bid</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input type="number" name="startingBid" value={formData.startingBid} onChange={handleInputChange}
                                        step="0.01" min="0" placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md outline-none focus:border-secondary font-bold text-gray-900" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Duration</label>
                                <select name="auctionDurationDays" value={formData.auctionDurationDays} onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary">
                                    <option value={3}>3 days</option>
                                    <option value={5}>5 days</option>
                                    <option value={7}>7 days</option>
                                    <option value={10}>10 days</option>
                                    <option value={30}>30 days</option>
                                </select>
                            </div>
                        </>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Shipping fee</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input type="number" name="shippingFee" value={formData.shippingFee} onChange={handleInputChange}
                                step="0.01" min="0" placeholder="0.00"
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md outline-none focus:border-secondary text-gray-900" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 py-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
                <div className="max-w-[1000px] mx-auto px-4 flex justify-end items-center gap-6">
                    <button onClick={() => navigate('/seller/listings')} className="text-secondary font-bold hover:underline text-sm">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={sellerLoading}
                        className="px-10 py-2.5 bg-secondary text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-secondary/10 flex items-center gap-2 disabled:opacity-50"
                    >
                        {sellerLoading && <Loader2 size={16} className="animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
