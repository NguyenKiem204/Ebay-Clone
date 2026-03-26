using ebay.Models;

namespace ebay.Services.Implementations
{
    internal static class AuctionPricingEngine
    {
        internal sealed class AuctionComputation
        {
            public decimal CurrentPrice { get; set; }
            public decimal MinimumNextBid { get; set; }
            public bool ReserveMet { get; set; }
            public bool BuyItNowAvailable { get; set; }
            public int BidCount { get; set; }
            public int? TopBidderId { get; set; }
            public decimal? TopBidderMaxAmount { get; set; }
            public Bid? WinningBid { get; set; }
        }

        private sealed class BidderSummary
        {
            public int BidderId { get; set; }
            public decimal MaxAmount { get; set; }
            public DateTime FirstTopBidTime { get; set; }
            public Bid PrimaryBid { get; set; } = null!;
        }

        internal static AuctionComputation ComputeAuctionState(Product product, IReadOnlyCollection<Bid> activeBids)
        {
            var startingPrice = ResolveStartingPrice(product);

            var groupedBids = activeBids
                .GroupBy(b => b.BidderId)
                .Select(group =>
                {
                    var topMax = group.Max(GetEffectiveMax);
                    var primary = group
                        .Where(b => GetEffectiveMax(b) == topMax)
                        .OrderBy(b => b.BidTime ?? DateTime.MinValue)
                        .ThenBy(b => b.Id)
                        .First();

                    return new BidderSummary
                    {
                        BidderId = group.Key,
                        MaxAmount = topMax,
                        FirstTopBidTime = primary.BidTime ?? DateTime.MinValue,
                        PrimaryBid = primary
                    };
                })
                .OrderByDescending(x => x.MaxAmount)
                .ThenBy(x => x.FirstTopBidTime)
                .ThenBy(x => x.BidderId)
                .ToList();

            var top = groupedBids.FirstOrDefault();
            var second = groupedBids.Skip(1).FirstOrDefault();

            var currentPrice = startingPrice;
            if (top != null && second != null)
            {
                currentPrice = Math.Min(top.MaxAmount, second.MaxAmount + GetBidIncrement(second.MaxAmount));
                if (currentPrice < startingPrice)
                {
                    currentPrice = startingPrice;
                }
            }

            currentPrice = RoundCurrency(currentPrice);

            var minimumNextBid = top == null
                ? startingPrice
                : RoundCurrency(currentPrice + GetBidIncrement(currentPrice));

            var reserveMet = !product.ReservePrice.HasValue || currentPrice >= product.ReservePrice.Value;
            var buyItNowAvailable = product.BuyItNowPrice.HasValue && (top == null || !reserveMet);

            return new AuctionComputation
            {
                CurrentPrice = currentPrice,
                MinimumNextBid = minimumNextBid,
                ReserveMet = reserveMet,
                BuyItNowAvailable = buyItNowAvailable,
                BidCount = activeBids.Count,
                TopBidderId = top?.BidderId,
                TopBidderMaxAmount = top?.MaxAmount,
                WinningBid = top?.PrimaryBid
            };
        }

        internal static decimal GetBidIncrement(decimal currentPrice)
        {
            if (currentPrice < 1m) return 0.05m;
            if (currentPrice < 5m) return 0.25m;
            if (currentPrice < 25m) return 0.50m;
            if (currentPrice < 100m) return 1.00m;
            if (currentPrice < 250m) return 2.50m;
            if (currentPrice < 500m) return 5.00m;
            if (currentPrice < 1000m) return 10.00m;
            if (currentPrice < 2500m) return 25.00m;
            if (currentPrice < 5000m) return 50.00m;
            return 100.00m;
        }

        private static decimal ResolveStartingPrice(Product product)
        {
            var startingPrice = product.StartingBid ?? product.CurrentBidPrice ?? product.Price;
            if (startingPrice <= 0)
            {
                startingPrice = 0.01m;
            }

            return RoundCurrency(startingPrice);
        }

        private static decimal GetEffectiveMax(Bid bid)
        {
            return RoundCurrency(bid.MaxAmount ?? bid.Amount);
        }

        private static decimal RoundCurrency(decimal value)
        {
            return Math.Round(value, 2, MidpointRounding.AwayFromZero);
        }
    }
}
