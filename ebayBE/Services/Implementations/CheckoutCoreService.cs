using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations;

public class CheckoutCoreService : ICheckoutCoreService
{
    private readonly EbayDbContext _context;

    public CheckoutCoreService(EbayDbContext context)
    {
        _context = context;
    }

    public async Task<CheckoutCoreResult> PrepareAsync(IEnumerable<CheckoutCoreItemRequest> items, CancellationToken cancellationToken = default)
    {
        var issues = new List<CheckoutCoreIssue>();
        var rawItems = items?.ToList() ?? new List<CheckoutCoreItemRequest>();

        if (!rawItems.Any())
        {
            issues.Add(new CheckoutCoreIssue
            {
                Code = "empty_checkout",
                Message = "Checkout must contain at least one item."
            });

            return BuildResult(Array.Empty<CheckoutCoreNormalizedItem>(), issues);
        }

        var validInputs = new List<CheckoutCoreItemRequest>();

        foreach (var item in rawItems)
        {
            if (item.ProductId <= 0)
            {
                issues.Add(new CheckoutCoreIssue
                {
                    ProductId = item.ProductId,
                    Code = "invalid_product_id",
                    Message = "Product ID must be greater than zero."
                });
                continue;
            }

            if (item.Quantity <= 0)
            {
                issues.Add(new CheckoutCoreIssue
                {
                    ProductId = item.ProductId,
                    Code = "invalid_quantity",
                    Message = "Quantity must be greater than zero."
                });
                continue;
            }

            validInputs.Add(item);
        }

        var normalizedInputs = validInputs
            .GroupBy(item => item.ProductId)
            .Select(group => new CheckoutCoreItemRequest
            {
                ProductId = group.Key,
                Quantity = group.Sum(x => x.Quantity)
            })
            .ToList();

        if (!normalizedInputs.Any())
        {
            return BuildResult(Array.Empty<CheckoutCoreNormalizedItem>(), issues);
        }

        var productIds = normalizedInputs.Select(item => item.ProductId).ToList();
        var products = await _context.Products
            .AsNoTracking()
            .Include(product => product.Bids)
            .Where(product => productIds.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id, cancellationToken);

        var normalizedItems = new List<CheckoutCoreNormalizedItem>();

        foreach (var input in normalizedInputs)
        {
            if (!products.TryGetValue(input.ProductId, out var product))
            {
                issues.Add(new CheckoutCoreIssue
                {
                    ProductId = input.ProductId,
                    Code = "product_not_found",
                    Message = $"Product {input.ProductId} does not exist."
                });
                continue;
            }

            var availableStock = product.Stock ?? 0;
            var isSellable = product.IsActive == true && string.Equals(product.Status, "active", StringComparison.OrdinalIgnoreCase);
            var isAuction = product.IsAuction == true;
            var allowAuctionBuyItNow = input.AllowAuctionBuyItNow && isAuction && input.Quantity == 1;
            var shippingFee = product.ShippingFee ?? 0m;
            var unitPrice = product.Price;
            var lineSubtotal = unitPrice * input.Quantity;
            var lineTotal = lineSubtotal + shippingFee;

            if (!isSellable)
            {
                issues.Add(new CheckoutCoreIssue
                {
                    ProductId = product.Id,
                    Code = "product_not_sellable",
                    Message = $"Product {product.Id} is not currently sellable."
                });
            }

            if (availableStock < input.Quantity)
            {
                issues.Add(new CheckoutCoreIssue
                {
                    ProductId = product.Id,
                    Code = "insufficient_stock",
                    Message = $"Product {product.Id} does not have enough stock."
                });
            }

            if (isAuction)
            {
                if (!allowAuctionBuyItNow)
                {
                    issues.Add(new CheckoutCoreIssue
                    {
                        ProductId = product.Id,
                        Code = "auction_item",
                        Message = $"Product {product.Id} is an auction item and is not eligible for this checkout flow."
                    });
                }
                else
                {
                    var now = DateTime.UtcNow;
                    var normalizedStatus = string.IsNullOrWhiteSpace(product.AuctionStatus)
                        ? "live"
                        : product.AuctionStatus.Trim().ToLowerInvariant();
                    var activeBids = product.Bids
                        .Where(bid => bid.IsRetracted != true)
                        .ToList();
                    var computed = AuctionPricingEngine.ComputeAuctionState(product, activeBids);

                    if (product.AuctionStartTime.HasValue && product.AuctionStartTime.Value > now)
                    {
                        issues.Add(new CheckoutCoreIssue
                        {
                            ProductId = product.Id,
                            Code = "auction_not_started",
                            Message = $"Product {product.Id} auction has not started yet."
                        });
                    }

                    if (product.AuctionEndTime.HasValue && product.AuctionEndTime.Value <= now)
                    {
                        issues.Add(new CheckoutCoreIssue
                        {
                            ProductId = product.Id,
                            Code = "auction_ended",
                            Message = $"Product {product.Id} auction has already ended."
                        });
                    }

                    if (normalizedStatus is "sold" or "ended" or "reserve_not_met" or "cancelled")
                    {
                        issues.Add(new CheckoutCoreIssue
                        {
                            ProductId = product.Id,
                            Code = "auction_closed",
                            Message = $"Product {product.Id} auction is no longer available for Buy It Now."
                        });
                    }

                    if (!product.BuyItNowPrice.HasValue || !computed.BuyItNowAvailable)
                    {
                        issues.Add(new CheckoutCoreIssue
                        {
                            ProductId = product.Id,
                            Code = "buy_it_now_unavailable",
                            Message = $"Product {product.Id} no longer supports Buy It Now."
                        });
                    }

                    unitPrice = product.BuyItNowPrice ?? product.Price;
                    lineSubtotal = unitPrice * input.Quantity;
                    lineTotal = lineSubtotal + shippingFee;
                }
            }

            normalizedItems.Add(new CheckoutCoreNormalizedItem
            {
                ProductId = product.Id,
                Title = product.Title,
                SellerId = product.SellerId,
                Quantity = input.Quantity,
                UnitPrice = unitPrice,
                LineSubtotal = lineSubtotal,
                ShippingFee = shippingFee,
                LineTotal = lineTotal,
                AvailableStock = availableStock,
                IsAuction = isAuction
            });
        }

        return BuildResult(normalizedItems, issues);
    }

    private static CheckoutCoreResult BuildResult(
        IReadOnlyList<CheckoutCoreNormalizedItem> normalizedItems,
        IReadOnlyList<CheckoutCoreIssue> issues)
    {
        var subtotal = normalizedItems.Sum(item => item.LineSubtotal);
        var shippingFee = normalizedItems.Sum(item => item.ShippingFee);
        const decimal discountAmount = 0m;
        const decimal tax = 0m;
        var totalAmount = subtotal + shippingFee - discountAmount + tax;

        return new CheckoutCoreResult
        {
            IsValid = issues.Count == 0,
            GuestPhase1Eligible = issues.Count == 0 && normalizedItems.Count > 0 && normalizedItems.All(item => !item.IsAuction),
            NormalizedItems = normalizedItems,
            Issues = issues,
            Subtotal = subtotal,
            ShippingFee = shippingFee,
            DiscountAmount = discountAmount,
            Tax = tax,
            TotalAmount = totalAmount
        };
    }
}
