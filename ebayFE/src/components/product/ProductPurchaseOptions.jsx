import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { useCart } from '../../features/cart/hooks/useCart';
import useCartStore from '../../features/cart/hooks/useCartStore';
import AddToCartModal from './AddToCartModal';
import GuestCheckoutModal from './GuestCheckoutModal';
import SellerFeedbackModal from './SellerSection/SellerFeedbackModal';
import Modal from '../ui/Modal';
import { useDebounceButton } from '../../hooks/useDebounceButton';
import useAuthStore from '../../store/useAuthStore';
import useAuctionStore from '../../store/useAuctionStore';
import useWatchlistStore from '../../features/watchlist/useWatchlistStore';
import useAuctionSocket from '../../features/auction/hooks/useAuctionSocket';
import api from '../../lib/axios';
import {
    formatAuctionRelativeTime,
    formatAuctionTimestamp,
    getAuctionStatusMeta,
    normalizeAuctionLifecycle
} from '../../features/auction/utils/auctionPresentation';
import useCurrencyStore from '../../store/useCurrencyStore';

function formatCompactCount(value) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value?.toLocaleString() || '0';
}

function formatAuctionStatusCopy(status) {
    switch ((status || '').toUpperCase()) {
        case 'LEADING':
            return {
                title: 'You are leading',
                description: 'Your max bid is currently in front.',
                tone: 'border-green-200 bg-green-50 text-green-700'
            };
        case 'OUTBID':
            return {
                title: 'You have been outbid',
                description: 'Place a higher max bid to move back in front.',
                tone: 'border-red-200 bg-red-50 text-red-700'
            };
        case 'WINNING':
            return {
                title: 'Winning',
                description: 'You are the highest bidder right now.',
                tone: 'border-blue-200 bg-blue-50 text-blue-700'
            };
        case 'LOST':
            return {
                title: 'Auction ended',
                description: 'This listing is no longer accepting bids.',
                tone: 'border-gray-200 bg-gray-100 text-gray-700'
            };
        default:
            return null;
    }
}

function formatBidInputValue(value) {
    const digitsOnly = String(value ?? '').replace(/\D/g, '');
    if (!digitsOnly) {
        return '';
    }

    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseBidInputValue(value) {
    const digitsOnly = String(value ?? '').replace(/\D/g, '');
    if (!digitsOnly) {
        return NaN;
    }

    return Number(digitsOnly);
}

export default function ProductPurchaseOptions({ product }) {
    const { isVietnamese, formatVnd } = useCurrencyStore();
    const formatPrice = useCurrencyStore(s => s.formatPrice);
    const [quantity, setQuantity] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
    const [isBidConfirmOpen, setIsBidConfirmOpen] = useState(false);
    const [sellerProfile, setSellerProfile] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [isBidDirty, setIsBidDirty] = useState(false);
    const [pendingBidAmount, setPendingBidAmount] = useState(null);
    const [auctionFeedback, setAuctionFeedback] = useState(null);
    const [nowTick, setNowTick] = useState(() => Date.now());

    const navigate = useNavigate();
    const { addItem } = useCart();
    const cartItems = useCartStore((state) => state.items);
    const isInCart = cartItems.some((item) => item.id === product.id);
    const { isAuthenticated } = useAuthStore();

    const isWatched = useWatchlistStore((state) => state.watchIds.has(product?.id));
    const toggleWatch = useWatchlistStore((state) => state.toggleWatch);

    const isAuction = Boolean(product?.isAuction);
    const isOutOfStock = (product?.stock ?? 0) <= 0;

    const auctionStatesByProduct = useAuctionStore((state) => state.auctionStatesByProduct);
    const fallbackAuctionState = useAuctionStore((state) => state.auctionState);
    const fetchAuctionState = useAuctionStore((state) => state.fetchAuctionState);
    const placeBid = useAuctionStore((state) => state.placeBid);
    const clearBidResult = useAuctionStore((state) => state.clearBidResult);
    const auctionState = auctionStatesByProduct?.[product?.id] ?? fallbackAuctionState;

    const auctionStartTime = auctionState?.auctionStartTime || product?.auctionStartTime;
    const auctionEndTime = auctionState?.auctionEndTime || product?.auctionEndTime;
    const auctionStatus = normalizeAuctionLifecycle({
        auctionStatus: auctionState?.auctionStatus || product?.auctionStatus || 'live',
        auctionStartTime,
        auctionEndTime,
        winningBidderId: auctionState?.winningBidderId || product?.winningBidderId
    });
    const auctionStatusMeta = getAuctionStatusMeta(auctionStatus);
    const isAuctionClosed = ['sold', 'ended', 'cancelled'].includes(auctionStatus);
    const isAuctionScheduled = auctionStatus === 'scheduled';
    const displayAuctionPrice = auctionState?.currentPrice ?? product?.currentBid ?? product?.price ?? 0;
    const auctionMinNextBid = auctionState?.minimumNextBid ?? product?.minimumNextBid ?? displayAuctionPrice;
    const auctionBidCount = auctionState?.bidCount ?? product?.bidCount ?? 0;
    const auctionBuyItNowPrice = auctionState?.buyItNowPrice ?? product?.buyItNowPrice;
    const auctionBuyItNowAvailable = auctionState?.buyItNowAvailable ?? Boolean(auctionBuyItNowPrice && !isAuctionClosed && !isAuctionScheduled);
    const userBidStatus = auctionFeedback?.status || auctionState?.userBidStatus || 'NONE';
    const feedbackCopy = formatAuctionStatusCopy(userBidStatus);
    const timeLeft = isAuctionScheduled
        ? formatAuctionRelativeTime(auctionStartTime, 'Starts in', nowTick)
        : formatAuctionRelativeTime(auctionEndTime, 'Ends in', nowTick);
    const displayPrice = isAuction ? displayAuctionPrice : product?.price;
    const { lastUpdated } = useAuctionSocket(product?.id, {
        enabled: isAuction && !isAuctionClosed,
        intervalMs: 15000
    });

    useEffect(() => {
        if (!product?.sellerId) {
            return;
        }

        api.get(`/api/Seller/${product.sellerId}`)
            .then((response) => setSellerProfile(response.data.data))
            .catch(() => {});
    }, [product?.sellerId]);

    useEffect(() => {
        if (isAuction && auctionMinNextBid && !isBidDirty) {
            setBidAmount(formatBidInputValue(auctionMinNextBid));
        }
    }, [auctionMinNextBid, isAuction, isBidDirty]);

    useEffect(() => {
        if (!isAuction) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setNowTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [isAuction]);

    useEffect(() => {
        setAuctionFeedback(null);
        setIsBidDirty(false);
        clearBidResult();
    }, [clearBidResult, product?.id]);

    const spamOpts = {
        threshold: 2,
        windowMs: 600,
        blockDurationMs: 2000,
        warningMsg: 'Please avoid clicking too quickly.'
    };

    const { trigger: handleAddToCart, isBlocked: addBlocked } = useDebounceButton(async () => {
        if (isAuction) {
            toast.error('Auction listings cannot be added to cart.');
            return;
        }

        await addItem(product, quantity);
        setIsModalOpen(true);
    }, spamOpts);

    const validateAuctionBid = () => {
        if (isAuctionScheduled) {
            toast.error('This auction has not started yet.');
            return null;
        }

        if (isAuctionClosed) {
            toast.error('Auction has ended.');
            return null;
        }

        if (!isAuthenticated) {
            navigate(`/login?redirect=/products/${product.id}`);
            return null;
        }

        const parsedBid = parseBidInputValue(bidAmount);
        if (!Number.isFinite(parsedBid) || parsedBid < Number(auctionMinNextBid || 0)) {
            toast.error(`Enter at least ${formatPrice(auctionMinNextBid)}.`);
            return null;
        }

        return parsedBid;
    };

    const handleAuctionBid = async (confirmedBidAmount) => {
        const parsedBid = Number(confirmedBidAmount);

        const result = await placeBid(product.id, parsedBid);
        if (!result.success) {
            toast.error(result.message || 'Failed to place bid.');
            return;
        }

        setAuctionFeedback({
            status: result.status,
            currentPrice: result.currentPrice,
            yourBid: result.yourBid
        });

        setBidAmount(formatBidInputValue(result.yourBid || result.currentPrice || auctionMinNextBid));
        setIsBidDirty(false);
        fetchAuctionState(product.id);
        toast.success('Bid placed successfully.');
    };

    const { trigger: handlePlaceBidClick, isBlocked: bidBlocked } = useDebounceButton(() => {
        const parsedBid = validateAuctionBid();
        if (!parsedBid) {
            return;
        }

        setPendingBidAmount(parsedBid);
        setIsBidConfirmOpen(true);
    }, spamOpts);

    const { trigger: handleBuyItNow, isBlocked: buyBlocked } = useDebounceButton(() => {
        if (isAuction) {
            if (!isAuthenticated) {
                navigate(`/login?redirect=/products/${product.id}`);
                return;
            }

            if (isAuctionScheduled) {
                toast.error('This auction has not started yet.');
                return;
            }

            if (isAuctionClosed) {
                toast.error('This auction is no longer available for Buy It Now.');
                return;
            }

            if (!auctionBuyItNowPrice || !auctionBuyItNowAvailable) {
                toast.error('Buy It Now is no longer available for this auction.');
                return;
            }

            navigate(`/checkout?buyItNow=1&productId=${product.id}&quantity=1`);
            return;
        }

        if (isAuthenticated) {
            navigate(`/checkout?buyItNow=1&productId=${product.id}&quantity=${quantity}`);
        } else {
            setIsGuestModalOpen(true);
        }
    }, spamOpts);

    const auctionSummaryCopy = isAuctionClosed
        ? `Auction status: ${auctionStatusMeta.label}. Final price ${formatPrice(displayAuctionPrice)}.`
        : `${auctionStatusMeta.label}. Current bid ${formatPrice(displayAuctionPrice)}. Minimum next bid ${formatPrice(auctionMinNextBid)}.`;
    const shippingCopy = Number(product?.shippingFee || 0) > 0 ? `${formatPrice(product.shippingFee)} shipping` : 'Free shipping';

    return (
        <div className="w-full">
            <GuestCheckoutModal
                isOpen={isGuestModalOpen}
                onClose={() => setIsGuestModalOpen(false)}
                product={product}
                quantity={quantity}
            />
            <AddToCartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={product}
                quantity={quantity}
            />
            <SellerFeedbackModal
                isOpen={isSellerModalOpen}
                onClose={() => setIsSellerModalOpen(false)}
                sellerId={product?.sellerId}
                productId={product?.id}
            />
            <Modal
                isOpen={isBidConfirmOpen}
                onClose={() => setIsBidConfirmOpen(false)}
                title="Confirm your bid"
                size="md"
            >
                <div className="space-y-5">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500">Current price</p>
                                <p className="text-2xl font-bold text-gray-900">{formatPrice(displayAuctionPrice)}</p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                                <p>{shippingCopy}</p>
                                <p>{timeLeft}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f5f7fa] px-4 py-4">
                        <div>
                            <p className="text-sm text-gray-500">Your bid amount</p>
                            <p className="text-3xl font-bold text-gray-900">{formatPrice(pendingBidAmount)}</p>
                        </div>
                        <Button
                            onClick={async () => {
                                const confirmedBid = pendingBidAmount;
                                setIsBidConfirmOpen(false);
                                await handleAuctionBid(confirmedBid);
                            }}
                            className="h-12 min-w-[160px] rounded-xl bg-[#3665f3] px-6 text-base font-bold text-white hover:bg-blue-700"
                        >
                            Confirm
                        </Button>
                    </div>

                    <p className="text-sm leading-relaxed text-gray-600">
                        When you confirm your bid, you are committing to buy this item if you are the winning bidder.
                    </p>
                </div>
            </Modal>

            <div className="mb-6">
                <h1 className="mb-4 text-[22px] font-bold leading-[1.2] text-gray-900">
                    {product.title}
                </h1>

                <div
                    className="group flex cursor-pointer items-center gap-3 border-t border-gray-100 pt-4"
                    onClick={() => setIsSellerModalOpen(true)}
                >
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-200">
                        <img
                            src={sellerProfile?.avatarUrl || 'https://i.ebayimg.com/images/g/2i4AAOSwAWZngDgE/s-l64.jpg'}
                            alt="seller"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 hover:underline">
                                {sellerProfile?.username || product.sellerName || 'Unknown'}
                            </span>
                            <span className="text-[13px] text-gray-500">
                                ({sellerProfile ? formatCompactCount(sellerProfile.totalReviews) : '...'})
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[13px]">
                            <span className="text-gray-900 underline underline-offset-2">
                                {sellerProfile ? `${sellerProfile.positivePercent}% positive` : '...'}
                            </span>
                            <Link
                                to="#"
                                className="text-gray-900 underline underline-offset-2"
                                onClick={(event) => event.stopPropagation()}
                            >
                                Seller&apos;s other items
                            </Link>
                            <Link
                                to="#"
                                className="text-gray-900 underline underline-offset-2"
                                onClick={(event) => event.stopPropagation()}
                            >
                                Contact seller
                            </Link>
                        </div>
                    </div>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400">
                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex flex-col mb-1">
                    <span className="text-[24px] font-bold text-gray-900">
                        US {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(displayPrice)}
                    </span>
                    {isVietnamese && (
                        <span className="text-[13px] text-gray-500 mt-0.5">
                            Approximately <span className="font-medium text-gray-700">{formatVnd(displayPrice)}</span>
                        </span>
                    )}
                </div>

                {isAuthenticated && !isAuction ? (
                    <div className="mb-4 flex items-center gap-2 text-[15px] text-[#248232]">
                        <span className="font-bold">
                            Save {formatPrice(15.00, true)}
                        </span>
                        <span className="font-normal text-gray-500">with coupon code</span>
                        <Link to="#" className="text-[13px] text-gray-500 underline">
                            Price details
                        </Link>
                    </div>
                ) : (
                    <div className="mb-4 text-[14px] text-gray-600">
                        {isAuction
                            ? auctionSummaryCopy
                            : 'Guest checkout supports eligible fixed-price items with Cash on Delivery (COD) only.'}
                    </div>
                )}

                {isAuction && (
                    <div className="mb-6 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500">Auction status</p>
                                <p className={`mt-1 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${auctionStatusMeta.badgeClassName}`}>
                                    {auctionStatusMeta.label}
                                </p>
                            </div>
                            <div className="text-right text-sm">
                                <p className="text-gray-500">{isAuctionScheduled ? 'Starts' : 'Ends'}</p>
                                <p className="font-bold text-gray-900">{formatAuctionTimestamp(isAuctionScheduled ? auctionStartTime : auctionEndTime)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-500">Current bid</p>
                                <p className="font-bold text-gray-900 leading-tight">
                                    US {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displayAuctionPrice)}
                                </p>
                                {isVietnamese && (
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        ≈ {formatVnd(displayAuctionPrice)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-gray-500">Minimum next bid</p>
                                <p className="font-bold text-gray-900 leading-tight">
                                    US {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(auctionMinNextBid)}
                                </p>
                                {isVietnamese && (
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        ≈ {formatVnd(auctionMinNextBid)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-gray-500">{isAuctionScheduled ? 'Starts in' : 'Time left'}</p>
                                <p className="font-bold text-gray-900">{timeLeft}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Bids</p>
                                <p className="font-bold text-gray-900">{auctionBidCount}</p>
                            </div>
                            {auctionBuyItNowPrice && (
                                <div>
                                    <p className="text-gray-500">Buy It Now</p>
                                    <p className="font-bold text-gray-900 leading-tight">
                                        US {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(auctionBuyItNowPrice)}
                                    </p>
                                    {isVietnamese && (
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            ≈ {formatVnd(auctionBuyItNowPrice)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isAuctionClosed && lastUpdated && (
                            <p className="text-xs text-gray-500">
                                Auto-refreshing live bids every 15 seconds.
                            </p>
                        )}

                        {feedbackCopy && (
                            <div className={`rounded-xl border px-3 py-2 ${feedbackCopy.tone}`}>
                                <p className="text-sm font-semibold">{feedbackCopy.title}</p>
                                <p className="text-sm opacity-90">{feedbackCopy.description}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="maxBid" className="text-sm font-semibold text-gray-900">
                                Your max bid
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="maxBid"
                                    type="text"
                                    inputMode="numeric"
                                    value={bidAmount}
                                    onChange={(event) => {
                                        setIsBidDirty(true);
                                        setBidAmount(formatBidInputValue(event.target.value));
                                    }}
                                    disabled={isAuctionClosed || isAuctionScheduled}
                                    className="h-12 flex-1 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-[#3665f3] disabled:bg-gray-100"
                                    placeholder={`Min ${formatBidInputValue(auctionMinNextBid)}`}
                                />
                                <Button
                                    onClick={handlePlaceBidClick}
                                    disabled={bidBlocked || isAuctionClosed || isAuctionScheduled}
                                    className="h-12 rounded-full bg-[#3665f3] px-6 text-[15px] font-bold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {!isAuthenticated ? 'Sign in to bid' : 'Place bid'}
                                </Button>
                            </div>
                            {auctionFeedback?.yourBid ? (
                                <p className="text-sm text-gray-600">
                                    Your latest max bid: <span className="font-semibold text-gray-900">{formatPrice(auctionFeedback.yourBid)}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Enter the highest amount you are willing to pay.
                                </p>
                            )}
                        </div>

                        {auctionBuyItNowPrice && (
                            <div className="space-y-2 rounded-2xl border border-blue-100 bg-white p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Buy It Now price</p>
                                        <p className="text-sm text-gray-500">
                                            Purchase instantly at the fixed auction price.
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-[#3665f3]">{formatPrice(auctionBuyItNowPrice)}</p>
                                </div>
                                <Button
                                    onClick={handleBuyItNow}
                                    disabled={buyBlocked || !auctionBuyItNowAvailable || isAuctionClosed || isAuctionScheduled}
                                    className="h-12 w-full rounded-full border border-[#3665f3] bg-white text-[15px] font-bold text-[#3665f3] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {!isAuthenticated ? 'Sign in to buy it now' : 'Buy It Now'}
                                </Button>
                                {!auctionBuyItNowAvailable && !isAuctionClosed && !isAuctionScheduled && (
                                    <p className="text-sm text-gray-500">
                                        Buy It Now is no longer available for this auction.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="w-20 text-[14px] text-gray-600">Condition:</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[14px] font-bold text-gray-900">
                                {product.condition || 'Excellent - Refurbished'}
                            </span>
                            <Info size={16} className="text-gray-400" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="w-20 text-[14px] text-gray-600">Quantity:</span>
                        {isAuction ? (
                            <div className="text-[14px] text-gray-500">
                                <span className="font-semibold text-gray-900">1</span> per auction listing
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    max={product.stock > 0 ? product.stock : 1}
                                    value={quantity}
                                    onChange={(event) => setQuantity(Math.min(
                                        product.stock > 0 ? product.stock : 1,
                                        Math.max(1, parseInt(event.target.value, 10) || 1)
                                    ))}
                                    className="h-10 w-[60px] rounded border border-gray-300 px-3 text-center"
                                />
                                <span className="text-[14px] text-gray-500">
                                    {product.stock > 0 ? (
                                        <>
                                            {product.stock} available {product.soldCount > 0 && <span>&middot; {product.soldCount} sold</span>}
                                        </>
                                    ) : (
                                        <span className="font-bold text-[#dd1e31]">Out of stock</span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    {!isAuction && (
                        <Button
                            onClick={handleBuyItNow}
                            disabled={buyBlocked || isOutOfStock}
                            className="h-[50px] w-full rounded-full bg-[#3665f3] text-[16px] font-bold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isOutOfStock ? 'Out of stock' : 'Buy It Now'}
                        </Button>
                    )}

                    {!isAuction && (
                        <Button
                            onClick={isInCart ? () => navigate('/cart') : handleAddToCart}
                            disabled={isOutOfStock || (!isInCart && addBlocked)}
                            className="h-[50px] w-full rounded-full border border-[#3665f3] bg-white text-[16px] font-bold text-[#3665f3] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isInCart ? 'See in cart' : 'Add to cart'}
                        </Button>
                    )}

                    <Button
                        onClick={() => {
                            if (!isAuthenticated) {
                                navigate(`/login?redirect=/products/${product.id}`);
                                return;
                            }

                            toggleWatch(product.id);
                        }}
                        className={`flex h-[50px] w-full items-center justify-center gap-2 rounded-full border text-[16px] font-bold transition-colors ${
                            isWatched
                                ? 'border-red-400 bg-red-50 text-red-500 hover:bg-red-100'
                                : 'border-[#3665f3] bg-white text-[#3665f3] hover:bg-blue-50'
                        }`}
                    >
                        <Heart size={20} className={isWatched ? 'fill-red-500 text-red-500' : ''} />
                        <span>{isWatched ? 'Watching' : 'Add to Watchlist'}</span>
                    </Button>
                </div>

                {(product.soldCount > 0 || product.savedCount > 0) && (
                    <div className="mt-6 flex flex-col gap-3 rounded-lg bg-[#f7f7f7] p-4">
                        {product.soldCount > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                                <p className="pt-0.5 text-[14px] leading-tight text-gray-900">
                                    <span className="font-bold">
                                        {product.soldCount > 5 ? "This one's trending." : 'Good choice.'}
                                    </span>{' '}
                                    {product.soldCount} have already sold.
                                </p>
                            </div>
                        )}

                        {product.savedCount > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                                <p className="pt-0.5 text-[14px] leading-tight text-gray-900">
                                    <span className="font-bold">People want this.</span> {product.savedCount} people are watching this.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 space-y-4 border-t border-gray-100 pt-6 text-[13px]">
                    <div className="flex gap-4">
                        <span className="w-20 text-gray-500">Shipping:</span>
                        <div className="flex-1">
                            <p className="font-bold text-gray-900">
                                {shippingCopy}{' '}
                                <span className="font-normal italic text-gray-500">eBay International Shipping</span>
                            </p>
                            <Link to="#" className="text-gray-900 underline">
                                See details
                            </Link>
                            <p className="mt-1 text-gray-500">Located in: Seattle, WA, United States</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <span className="w-20 text-gray-500">Import fees:</span>
                        <p className="text-gray-900">
                            Import fees may apply on delivery <Info size={14} className="ml-1 inline" />
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <span className="w-20 text-gray-500">Delivery:</span>
                        <p className="text-gray-900">
                            Estimated between <span className="font-bold">Mon, Apr 20</span> and <span className="font-bold">Fri, May 15</span>
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <span className="w-20 text-gray-500">Returns:</span>
                        <p className="text-gray-900">
                            30 days returns. Buyer pays for return shipping.{' '}
                            <Link to="#" className="text-gray-900 underline">
                                See details
                            </Link>
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <span className="w-20 pt-1 text-gray-500">Payments:</span>
                        <div className="flex flex-wrap items-center gap-2">
                            {isAuthenticated ? (
                                <>
                                    {['PayPal', 'Google Pay', 'Visa', 'Mastercard', 'Discover', 'Diners Club'].map((method) => (
                                        <span
                                            key={method}
                                            className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700"
                                        >
                                            {method}
                                        </span>
                                    ))}
                                </>
                            ) : (
                                <p className="text-gray-900">
                                    Guest checkout payment: Cash on Delivery (COD) only for eligible fixed-price items.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
