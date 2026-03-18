import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

const COLUMN_GROUPS = {
    'Item': [
        { id: 'sku', label: 'Custom label (SKU)' },
        { id: 'itemNumber', label: 'Item number' },
        { id: 'format', label: 'Format' },
        { id: 'availableQuantity', label: 'Available quantity' },
        { id: 'soldQuantity', label: 'Sold quantity' },
        { id: 'initialQuantity', label: 'Initial quantity' },
        { id: 'duration', label: 'Duration' },
    ],
    'Interest': [
        { id: 'views', label: 'Views (30 days)' },
        { id: 'promoted', label: 'Promoted Listings' },
        { id: 'watchers', label: 'Watchers' },
        { id: 'questions', label: 'Questions' },
        { id: 'bids', label: 'Bids' },
        { id: 'uniqueBidders', label: 'Unique bidders' },
        { id: 'highBidder', label: 'High bidder ID' },
        { id: 'offers', label: 'Offers' },
    ],
    'Pricing': [
        { id: 'price', label: 'Current price' },
        { id: 'discounts', label: 'Discounts' },
        { id: 'startPrice', label: 'Start price' },
        { id: 'reservePrice', label: 'Reserve price' },
        { id: 'shipping', label: 'Shipping cost' },
    ],
    'Timing': [
        { id: 'startDate', label: 'Start date' },
        { id: 'endDate', label: 'End date' },
    ]
};

const DEFAULT_COLUMNS = ['photo', 'title', 'price', 'availableQuantity', 'views', 'status', 'actions'];
const FIXED_COLUMNS = ['photo', 'title', 'actions']; // Cannot be hidden

export default function CustomizeTableModal({ isOpen, onClose, currentColumns, onSave }) {
    const [selectedCols, setSelectedCols] = useState(currentColumns || DEFAULT_COLUMNS);

    const toggleColumn = (id) => {
        if (FIXED_COLUMNS.includes(id)) return;
        setSelectedCols(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const moveColumn = (index, direction) => {
        const newCols = [...selectedCols];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newCols.length) return;

        [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
        setSelectedCols(newCols);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Customize active view</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-8 flex flex-col md:flex-row gap-12">
                    {/* Available Options */}
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Available Options</h3>
                        <p className="text-sm text-gray-500 mb-8">Select columns you want to display in your table.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                            {Object.entries(COLUMN_GROUPS).map(([group, columns]) => (
                                <div key={group} className="space-y-4">
                                    <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">{group}</h4>
                                    <div className="space-y-3">
                                        {columns.map(col => (
                                            <label key={col.id} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCols.includes(col.id)}
                                                    onChange={() => toggleColumn(col.id)}
                                                    disabled={FIXED_COLUMNS.includes(col.id)}
                                                    className="w-5 h-5 rounded border-gray-300 text-secondary focus:ring-secondary/20 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                />
                                                <span className={`text-sm ${selectedCols.includes(col.id) ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                    {col.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Arrange */}
                    <div className="w-full md:w-72 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Arrange</h3>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/30 flex-grow">
                            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                                {selectedCols.map((colId, index) => {
                                    // Find label
                                    let label = colId.charAt(0).toUpperCase() + colId.slice(1);
                                    Object.values(COLUMN_GROUPS).forEach(group => {
                                        const found = group.find(c => c.id === colId);
                                        if (found) label = found.label;
                                    });

                                    return (
                                        <div key={colId} className="px-4 py-3 flex items-center justify-between group hover:bg-white transition-colors bg-white/50">
                                            <span className="text-sm text-gray-800 font-medium">{label}</span>
                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => moveColumn(index, -1)}
                                                    disabled={index === 0}
                                                    className="p-0.5 hover:text-secondary disabled:text-gray-300"
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => moveColumn(index, 1)}
                                                    disabled={index === selectedCols.length - 1}
                                                    className="p-0.5 hover:text-secondary disabled:text-gray-300"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex flex-wrap justify-end gap-4 bg-gray-50/50">
                    <button
                        onClick={() => setSelectedCols(DEFAULT_COLUMNS)}
                        className="px-8 py-2.5 bg-white border border-gray-300 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Restore Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-white border border-gray-300 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(selectedCols)}
                        className="px-10 py-2.5 bg-secondary text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-secondary/20"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
