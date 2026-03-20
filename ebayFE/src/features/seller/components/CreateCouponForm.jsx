import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Percent, Tag, Calendar, Package, Layers, Globe, X, Plus, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import useCategoryStore from '../../../store/useCategoryStore';
import useAuthStore from '../../../store/useAuthStore';
import useStoreStore from '../../../store/useStoreStore';
import useProductStore from '../../../store/useProductStore';
import ProductSelectorModal from './ProductSelectorModal';
import couponService from '../services/couponService';
import toast from 'react-hot-toast';

const toLocalISO = (dateInput) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const schema = yup.object().shape({
  code: yup.string().required('Coupon code is required').max(50),
  description: yup.string().max(255),
  discountType: yup.string().required(),
  discountValue: yup.number().required().min(0.01, 'Discount must be greater than 0'),
  minOrderAmount: yup.number().transform(v => isNaN(v) ? 0 : v).min(0),
  maxDiscount: yup.number()
    .transform(v => isNaN(v) ? null : v)
    .nullable()
    .when('discountType', {
      is: 'percentage',
      then: (schema) => schema.required('Max discount amount is required for percentage type').min(1, 'Must be at least 1đ'),
      otherwise: (schema) => schema.nullable()
    }),
  startDate: yup.date().required(),
  endDate: yup.date().required().min(yup.ref('startDate'), 'End date must be after start date'),
  maxUsage: yup.number().required().min(1),
  maxUsagePerUser: yup.number().required().min(1),
  applicableTo: yup.string().required(),
  categoryId: yup.number().nullable().when('applicableTo', {
    is: 'category',
    then: (schema) => schema.required('Category is required'),
    otherwise: (schema) => schema.nullable()
  })
});

export default function CreateCouponForm({ editCoupon = null, onCancel, onSuccess }) {
  const categories = useCategoryStore(state => state.categories);
  const fetchCategories = useCategoryStore(state => state.fetchCategories);
  const { user } = useAuthStore();
  const store = useStoreStore(state => state.store);
  const fetchMyStore = useStoreStore(state => state.fetchMyStore);
  const sellerProducts = useProductStore(state => state.sellerProducts);
  const fetchSellerProducts = useProductStore(state => state.fetchSellerProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(editCoupon?.products || []);
  const [productSearch, setProductSearch] = useState('');
  const isEditing = !!editCoupon;

  useEffect(() => {
    setSelectedProducts(editCoupon?.products || editCoupon?.Products || []);
  }, [editCoupon]);

  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: editCoupon ? {
      ...editCoupon,
      startDate: toLocalISO(editCoupon.startDate),
      endDate: toLocalISO(editCoupon.endDate)
    } : {
      discountType: 'percentage',
      applicableTo: 'all',
      startDate: toLocalISO(new Date()),
      endDate: toLocalISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      maxUsage: 100,
      maxUsagePerUser: 1,
      minOrderAmount: 0
    }
  });

  const applicableTo = watch('applicableTo');
  const discountType = watch('discountType');
  const startDateValue = watch('startDate');
  const promotionStarted = isEditing && new Date(editCoupon.startDate) <= new Date();

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
    if (!store) fetchMyStore();
    if (sellerProducts.length === 0) fetchSellerProducts({ PageSize: 500 });
  }, [fetchCategories, store, fetchMyStore, fetchSellerProducts, categories.length, sellerProducts.length]);

  const filteredSellerProducts = sellerProducts.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase()) &&
    !selectedProducts.some(sp => sp.id === p.id)
  ).slice(0, 5);

  const onSubmit = async (data) => {
    try {
      if (data.applicableTo === 'product' && selectedProducts.length === 0) {
        toast.error('Vui lòng chọn ít nhất một sản phẩm');
        return;
      }

      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        storeId: store?.id,
        productIds: data.applicableTo === 'product' ? selectedProducts.map(p => p.id) : [],
        // For fixed type: auto set maxDiscount = discountValue
        maxDiscount: data.discountType === 'fixed' ? data.discountValue : data.maxDiscount
      };

      if (isEditing) {
        await couponService.updateCoupon(editCoupon.id, payload);
        toast.success('Cập nhật mã giảm giá thành công');
      } else {
        await couponService.createCoupon(payload);
        toast.success('Tạo mã giảm giá thành công');
      }
      onSuccess();
    } catch (error) {
      const apiRes = error.response?.data;
      let hasMappedError = false;

      if (apiRes?.errors) {
        Object.keys(apiRes.errors).forEach(field => {
          // Handle JSON path style keys like "$.productIds[0]"
          let fieldName = field;
          if (field.startsWith('$.')) {
             const match = field.match(/\$\.([^\[]+)/);
             if (match) fieldName = match[1];
          }

          // Map backend field names (TitleCase) to frontend (camelCase)
          const formField = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
          
          setError(formField, {
            type: 'manual',
            message: apiRes.errors[field][0]
          });
          hasMappedError = true;
        });
      }

      // If we couldn't map any specific field errors, or if there's a general message, show a toast
      const message = apiRes?.message || apiRes?.title || 'Có lỗi xảy ra';
      
      // If we have errors that don't map to fields, we should still show them
      if (apiRes?.errors) {
        const unmappedErrors = Object.keys(apiRes.errors).filter(field => {
          const formField = field.charAt(0).toLowerCase() + field.slice(1);
          return !['code', 'description', 'discountType', 'discountValue', 'minOrderAmount', 'maxDiscount', 'startDate', 'endDate', 'maxUsage', 'maxUsagePerUser', 'applicableTo', 'categoryId'].includes(formField);
        });
        
        if (unmappedErrors.length > 0) {
          toast.error(`${message}: ${apiRes.errors[unmappedErrors[0]][0]}`);
          return;
        }
      }

      // Don't show generic toast if we have specific errors unless it's a real specific message
      if (!hasMappedError || apiRes?.message) {
        toast.error(message);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit coupon' : 'Create a coupon'}</h2>
          <p className="text-sm text-gray-500 mt-1">Configure your promotion details below.</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-12">
        {/* Step 1: Identity */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-secondary">
            <Tag size={20} className="font-bold" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">1. Coupon Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Coupon Code <span className="text-red-500">*</span></label>
              <input
                {...register('code')}
                disabled={isEditing}
                placeholder="e.g. SUMMER2026"
                className={`w-full border p-3 rounded-md outline-none transition-all ${isEditing ? 'bg-gray-50 text-gray-400' : 'focus:border-secondary border-gray-300'}`}
              />
              {errors.code && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.code.message}</p>}
              <p className="text-[11px] text-gray-400">The code buyers enter at checkout. Max 50 chars.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Description</label>
              <textarea
                {...register('description')}
                placeholder="Short description for your records"
                className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-secondary h-[46px] resize-none"
              />
            </div>
          </div>
        </section>

        {/* Step 2: Discount */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-secondary">
            <Percent size={20} className="font-bold" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">2. Discount Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-600 uppercase">Discount Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={promotionStarted}
                  onClick={() => setValue('discountType', 'percentage')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${discountType === 'percentage' ? 'border-secondary bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <Percent className={discountType === 'percentage' ? 'text-secondary' : 'text-gray-400'} />
                  <span className={`text-xs font-bold mt-2 ${discountType === 'percentage' ? 'text-gray-900' : 'text-gray-500'}`}>Percentage</span>
                </button>
                <button
                  type="button"
                  disabled={promotionStarted}
                  onClick={() => setValue('discountType', 'fixed')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${discountType === 'fixed' ? 'border-secondary bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <Tag className={discountType === 'fixed' ? 'text-secondary' : 'text-gray-400'} />
                  <span className={`text-xs font-bold mt-2 ${discountType === 'fixed' ? 'text-gray-900' : 'text-gray-500'}`}>Fixed Amount</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase">Discount Value <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">{discountType === 'percentage' ? '%' : 'đ'}</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('discountValue')}
                    className="w-full border border-gray-300 pl-8 pr-4 py-3 rounded-md outline-none focus:border-secondary font-bold text-lg"
                  />
                </div>
                {errors.discountValue && <p className="text-xs text-red-500">{errors.discountValue.message}</p>}
                {discountType === 'percentage' && <p className="text-[11px] text-gray-400">Values up to 100% are allowed.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Min Order Amount (VNĐ)
                </label>
                <input
                  type="number"
                  {...register('minOrderAmount')}
                  className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-secondary"
                />
                {errors.minOrderAmount && <p className="text-xs text-red-500">{errors.minOrderAmount.message}</p>}
              </div>

              {discountType === 'percentage' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Max Discount Amount (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-sm">đ</span>
                    <input
                      type="number"
                      step="1000"
                      {...register('maxDiscount')}
                      placeholder="e.g. 200000"
                      className="w-full border border-gray-300 pl-8 pr-4 py-3 rounded-md outline-none focus:border-secondary"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">The maximum amount (in VNĐ) the coupon can discount, even if the percentage is higher.</p>
                  {errors.maxDiscount && <p className="text-xs text-red-500">{errors.maxDiscount.message}</p>}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 3: Applicability */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-3 text-secondary">
            <Package size={20} className="font-bold" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">3. Applicable Products</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'all', label: 'All Items', icon: Globe, desc: 'Every item in store' },
              { id: 'category', label: 'By Category', icon: Layers, desc: 'Target a category' },
              { id: 'product', label: 'Selected Items', icon: Package, desc: 'Hand-pick items' },
            ].map(mode => (
              <label
                key={mode.id}
                className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all ${applicableTo === mode.id ? 'border-secondary bg-blue-50/20' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex justify-between items-start">
                  <mode.icon className={applicableTo === mode.id ? 'text-secondary' : 'text-gray-400'} size={24} />
                  <input type="radio" value={mode.id} {...register('applicableTo')} className="w-4 h-4 text-secondary" />
                </div>
                <p className="font-bold text-gray-900 mt-4">{mode.label}</p>
                <p className="text-xs text-gray-500 mt-1">{mode.desc}</p>
              </label>
            ))}
          </div>

          {applicableTo === 'category' && (
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-4">
              <label className="text-xs font-bold text-gray-600 uppercase">Choose Category</label>
              <select {...register('categoryId')} className="w-full p-3 border border-gray-200 rounded-md bg-white outline-none focus:border-secondary">
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>
          )}

          {applicableTo === 'product' && (
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-600 uppercase">Search & Add products</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by product name..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-secondary outline-none bg-white"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {productSearch && filteredSellerProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {filteredSellerProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProducts([...selectedProducts, p]);
                            setProductSearch('');
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <img src={p.thumbnail || p.imageUrl} className="w-8 h-8 rounded object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{p.title}</p>
                            <p className="text-xs text-secondary font-bold">{p.price.toLocaleString()}đ</p>
                          </div>
                          <Plus size={16} className="text-gray-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-600 uppercase">Selected Products ({selectedProducts.length})</label>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-secondary font-bold text-xs flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Full Selector
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedProducts.map(p => (
                  <div key={p.id} className="bg-white border border-gray-200 p-2 rounded-lg flex items-center gap-3 relative group">
                    <img src={p.thumbnail || p.imageUrl} className="w-8 h-8 rounded object-cover" />
                    <span className="text-[10px] font-bold text-gray-700 truncate">{p.title}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProducts(selectedProducts.filter(item => item.id !== p.id))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {selectedProducts.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="col-span-full border-2 border-dashed border-gray-200 p-8 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-all text-gray-400"
                  >
                    <Package size={32} />
                    <span className="text-sm font-bold">Pick specific products</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Step 4: Schedule */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-3 text-secondary">
            <Calendar size={20} className="font-bold" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">4. Schedule & Limits</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Start Date & Time</label>
              <input
                type="datetime-local"
                disabled={promotionStarted}
                {...register('startDate')}
                className={`w-full border p-3 rounded-md outline-none ${promotionStarted ? 'bg-gray-50 text-gray-400' : 'focus:border-secondary border-gray-300'}`}
              />
              {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">End Date & Time</label>
              <input
                type="datetime-local"
                {...register('endDate')}
                className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-secondary"
              />
              {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Max Total Usage</label>
              <input
                type="number"
                {...register('maxUsage')}
                className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-secondary"
              />
              {errors.maxUsage && <p className="text-xs text-red-500">{errors.maxUsage.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Max Usage Per Buyer</label>
              <input
                type="number"
                {...register('maxUsagePerUser')}
                className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-secondary"
              />
              {errors.maxUsagePerUser && <p className="text-xs text-red-500">{errors.maxUsagePerUser.message}</p>}
            </div>
          </div>
        </section>

        <div className="pt-12 border-t border-gray-100 flex justify-end gap-6 items-center">
          <button type="button" onClick={onCancel} className="text-gray-500 font-bold hover:text-gray-700 text-[15px] transition-colors">Discard changes</button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-white font-bold py-4 px-16 rounded-full hover:opacity-90 shadow-xl shadow-red-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <CheckCircle2 size={20} />}
            {isEditing ? 'Save Changes' : 'Launch Coupon'}
          </button>
        </div>
      </form>

      <ProductSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSelected={selectedProducts}
        onSelect={(products) => setSelectedProducts(products)}
      />
    </div>
  );
}
