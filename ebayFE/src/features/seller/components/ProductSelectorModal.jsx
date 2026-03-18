import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../components/ui/Modal';
import useProductStore from '../../../store/useProductStore';
import { Search, CheckCircle2, Circle } from 'lucide-react';
import Button from '../../../components/ui/Button';

export default function ProductSelectorModal({ isOpen, onClose, onSelect, initialSelected = [] }) {
    const { sellerProducts, loading, fetchSellerProducts } = useProductStore();
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSellerProducts({ PageSize: 500 });
            setSelectedIds(initialSelected.map(p => p.id));
        }
    }, [isOpen]); 

    const toggleProduct = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        const selectedProducts = [];
        selectedIds.forEach(id => {
            const fromInitial = initialSelected.find(p => p.id === id);
            if (fromInitial) {
                selectedProducts.push(fromInitial);
            } else {
                const fromSeller = sellerProducts.find(p => p.id === id);
                if (fromSeller) selectedProducts.push(fromSeller);
            }
        });
        onSelect(selectedProducts);
        onClose();
    };

    const filteredProducts = useMemo(() => {
        return [...sellerProducts]
            .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const aSelected = selectedIds.includes(a.id);
                const bSelected = selectedIds.includes(b.id);
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
            });
    }, [sellerProducts, searchTerm, selectedIds]);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Select Products for Coupon" 
            size="lg"
        >
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search your products..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-secondary outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="max-h-[400px] overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading products...</div>
                    ) : filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div 
                                key={product.id} 
                                onClick={() => toggleProduct(product.id)}
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer transition-colors group"
                            >
                                <div className="flex-shrink-0">
                                    {selectedIds.includes(product.id) ? (
                                        <CheckCircle2 className="w-6 h-6 text-secondary" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-gray-200 group-hover:text-gray-300" />
                                    )}
                                </div>
                                <img 
                                    src={product.thumbnail || product.imageUrl} 
                                    alt="" 
                                    className="w-12 h-12 object-cover rounded border border-gray-100" 
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{product.title}</p>
                                    <p className="text-xs text-secondary font-bold">{product.price.toLocaleString()}đ</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">No products found</div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">
                        {selectedIds.length} products selected
                    </span>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>
                            Add {selectedIds.length} Products
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
