export const mockCategories = [
    { id: 1, name: 'Laptops', slug: 'laptops', image: 'https://i.ebayimg.com/images/g/SwAAAeSwvwZpqvtW/s-l500.webp' },
    { id: 2, name: 'Computer parts', slug: 'computer-parts', image: 'https://i.ebayimg.com/images/g/Dz0AAeSwpDhpqvtW/s-l500.webp' },
    { id: 3, name: 'Smartphones', slug: 'smartphones', image: 'https://i.ebayimg.com/images/g/Rp0AAeSw2yNpqvtW/s-l500.webp' },
    { id: 4, name: 'Enterprise networking', slug: 'networking', image: 'https://i.ebayimg.com/images/g/O~AAAeSwcIZpqvtW/s-l500.webp' },
    { id: 5, name: 'Tablets and eBooks', slug: 'tablets', image: 'https://i.ebayimg.com/images/g/DaUAAeSwYXxpqvtW/s-l500.webp' },
    { id: 6, name: 'Storage and blank media', slug: 'storage', image: 'https://i.ebayimg.com/images/g/JmMAAeSwUztpqvu5/s-l500.webp' },
    { id: 7, name: 'Lenses and filters', slug: 'lenses', image: 'https://i.ebayimg.com/images/g/RusAAeSw0uxpqvtW/s-l500.webp' },
];

export const mockTrending = [
    { id: 1, name: 'Tech', slug: 'tech', image: 'https://i.ebayimg.com/images/g/EosAAeSw~Wxpqvvs/s-l500.webp' },
    { id: 2, name: 'Motors', slug: 'motors', image: 'https://i.ebayimg.com/images/g/XjIAAeSwsrNpqvvs/s-l500.webp' },
    { id: 3, name: 'Luxury', slug: 'luxury', image: 'https://i.ebayimg.com/images/g/FBUAAeSwpDhpqvvs/s-l500.webp' },
    { id: 4, name: 'Collectibles and art', slug: 'collectibles', image: 'https://i.ebayimg.com/images/g/FvQAAeSwMcVpqvvs/s-l500.webp' },
    { id: 5, name: 'Home and garden', slug: 'home-garden', image: 'https://i.ebayimg.com/images/g/WnYAAeSwPsRpqvvs/s-l500.webp' },
    { id: 6, name: 'Trading cards', slug: 'trading-cards', image: 'https://i.ebayimg.com/images/g/T6AAAeSwUotpqvvs/s-l500.webp' },
    { id: 7, name: 'Health and beauty', slug: 'health-beauty', image: 'https://i.ebayimg.com/images/g/M48AAeSwTkFpqvvs/s-l500.webp' },
];

export const mockProducts = [
    {
        id: 1,
        title: 'Bose Solo Soundbar 2 Home Theater, Certified Refurbished',
        price: 2435577,
        originalPrice: 5211611,
        image: 'https://i.ebayimg.com/images/g/~~8AAOSwUahnD9VM/s-l500.webp',
        isFreeShipping: true
    },
    {
        id: 2,
        title: 'Acer Predator Helios Neo AI 16S Gaming Laptop RTX 5070 Ti Certified Refurbished',
        price: 36094989,
        originalPrice: 49758838,
        image: 'https://i.ebayimg.com/images/g/vHUAAeSwg0ZphMv7/s-l500.webp',
        isFreeShipping: true
    },
    {
        id: 3,
        title: 'Apple iPhone 15 Pro Max A2849 256GB Unlocked Very Good',
        price: 14603248,
        originalPrice: null,
        image: 'https://i.ebayimg.com/images/g/zJoAAeSw6g5pJIvk/s-l500.webp',
        isFreeShipping: true
    },
    {
        id: 4,
        title: 'Roborock Qrevo MaxV Vacuum Cleaner,FlexiArm Edge Mop,Warm Air Drying - Certified',
        price: 11784788,
        originalPrice: 12177623,
        image: 'https://i.ebayimg.com/images/g/uSYAAeSwj~FoqDRE/s-l500.webp',
        isFreeShipping: true
    },
    {
        id: 5,
        title: 'NEW Puma Men\'s GS-One Spikeless Golf Shoes - Choose Size and Color!',
        price: 1204432,
        originalPrice: 3404570,
        image: 'https://i.ebayimg.com/images/g/cbwAAeSwGIZoL3jp/s-l500.webp',
        isFreeShipping: true
    }
];

export const mockAuctions = [
    {
        id: 101,
        title: 'High-End Multimedia Laptop 14" M3 Pro Chip - 16GB RAM | 512GB SSD | Space Gray',
        condition: 'New / Factory Sealed',
        watchers: 18,
        currentBid: 1250.00,
        bids: 14,
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 49 + 1000 * 60 * 12).toISOString(), // ~2 days 1 hour away
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&h=400&fit=crop',
        seller: 'TechDirect_Official',
        sellerFeedback: '99.8%',
        recentBids: [
            { id: 1, user: 'b***4', rating: 156, amount: 1250.00, time: '2 mins ago' },
            { id: 2, user: 'j***s', rating: 42, amount: 1225.00, time: '1 hour ago' },
            { id: 3, user: 'm***m', rating: 988, amount: 1200.00, time: '2 hours ago' },
            { id: 4, user: 'a***9', rating: 12, amount: 1175.00, time: '5 hours ago' },
        ]
    },
    {
        id: 102,
        title: 'Rare Charizard First Edition Pokemon Card - PSA 9',
        condition: 'Used',
        watchers: 156,
        currentBid: 1550.00,
        bids: 48,
        endTime: new Date(Date.now() + 1000 * 60 * 45).toISOString(), // 45 mins
        image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=400&h=400&fit=crop',
        seller: 'PokeCollect',
        sellerFeedback: '100%',
        recentBids: []
    },
    {
        id: 103,
        title: 'Vintage Rolex Submariner 1980 - No Reserve',
        condition: 'Pre-owned',
        watchers: 89,
        currentBid: 5200.00,
        bids: 24,
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours
        image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=400&h=400&fit=crop',
        seller: 'LuxuryWatchCo',
        sellerFeedback: '98.5%',
        recentBids: []
    },
    {
        id: 104,
        title: 'Sony PlayStation 5 Console - Disc Edition',
        condition: 'Seller refurbished',
        watchers: 42,
        currentBid: 320.00,
        bids: 8,
        endTime: new Date(Date.now() + 1000 * 60 * 120).toISOString(), // 2 hours
        image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=400&h=400&fit=crop',
        seller: 'ConsoleEmpire',
        sellerFeedback: '99.1%',
        recentBids: []
    }
];
