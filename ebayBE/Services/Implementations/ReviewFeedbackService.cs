using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class ReviewFeedbackService : IReviewFeedbackService
    {
        private const int ReviewWindowDays = 60;
        private const int EditWindowDays = 30;
        private const int MaxReviewMediaItems = 6;
        private const long ReviewMediaMaxFileSize = 25 * 1024 * 1024;
        private static readonly string[] ReviewMediaExtensions =
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".webm", ".ogg"
        };

        private readonly EbayDbContext _context;
        private readonly IFileService _fileService;

        public ReviewFeedbackService(EbayDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public async Task<List<ReviewEligibilityResponseDto>> GetOrderReviewEligibilityAsync(int userId, int orderId)
        {
            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.ShippingInfo)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Seller)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == userId);

            if (order == null)
            {
                throw new NotFoundException("Order not found.");
            }

            var itemIds = order.OrderItems.Select(item => item.Id).ToList();

            var existingReviews = await _context.Reviews
                .AsNoTracking()
                .Where(review => review.ReviewerId == userId && review.OrderItemId.HasValue && itemIds.Contains(review.OrderItemId.Value))
                .ToListAsync();

            var existingFeedback = await _context.SellerTransactionFeedbacks
                .AsNoTracking()
                .Where(feedback => feedback.BuyerId == userId && itemIds.Contains(feedback.OrderItemId))
                .ToListAsync();

            return order.OrderItems
                .Select(item =>
                {
                    var review = existingReviews.FirstOrDefault(existing => existing.OrderItemId == item.Id);
                    var feedback = existingFeedback.FirstOrDefault(existing => existing.OrderItemId == item.Id);
                    var reviewEligibility = EvaluateProductReviewEligibility(order, item, review);
                    var feedbackEligibility = EvaluateSellerFeedbackEligibility(order, item, feedback);

                    return new ReviewEligibilityResponseDto
                    {
                        OrderId = order.Id,
                        OrderNumber = order.OrderNumber,
                        OrderItemId = item.Id,
                        ProductId = item.ProductId,
                        ProductTitle = item.ProductTitleSnapshot ?? item.Product?.Title ?? "Product",
                        ProductImage = item.ProductImageSnapshot ?? item.Product?.Images?.FirstOrDefault(),
                        SellerId = item.SellerId,
                        SellerName = item.SellerDisplayNameSnapshot ?? item.Seller?.Username ?? "Seller",
                        CanReviewProduct = reviewEligibility.Eligible,
                        ReviewReason = reviewEligibility.Reason,
                        ExistingReviewId = review?.Id,
                        CanLeaveSellerFeedback = feedbackEligibility.Eligible,
                        SellerFeedbackReason = feedbackEligibility.Reason,
                        ExistingSellerFeedbackId = feedback?.Id,
                        DeliveredAt = ResolveDeliveredAt(order)
                    };
                })
                .ToList();
        }

        public async Task<ProductReviewItemResponseDto> CreateProductReviewAsync(int userId, CreateProductReviewRequestDto request)
        {
            ValidateProductReviewRequest(request.Rating, request.Content);

            var orderItem = await LoadOrderItemForBuyerAsync(userId, request.OrderItemId);
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(review => review.ReviewerId == userId && review.OrderItemId == orderItem.Id);

            var eligibility = EvaluateProductReviewEligibility(orderItem.Order, orderItem, existingReview);
            if (!eligibility.Eligible)
            {
                throw new BadRequestException(eligibility.Reason);
            }

            var now = DateTime.UtcNow;
            var review = new Review
            {
                ProductId = orderItem.ProductId,
                ReviewerId = userId,
                OrderId = orderItem.OrderId,
                OrderItemId = orderItem.Id,
                Rating = request.Rating,
                Title = NormalizeOptionalText(request.Title),
                Comment = request.Content.Trim(),
                Images = new List<string>(),
                IsVerifiedPurchase = true,
                HelpfulCount = 0,
                Status = "published",
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
            await CreateNotificationAsync(
                orderItem.SellerId,
                "product_review_received",
                "New product review",
                $"A buyer reviewed {orderItem.ProductTitleSnapshot ?? orderItem.Product?.Title ?? "your item"}.",
                "/seller/reviews");

            await PopulateReviewPresentationAsync(review);
            return MapPublicReview(review);
        }

        public async Task<ProductReviewItemResponseDto> UpdateProductReviewAsync(int userId, int reviewId, UpdateProductReviewRequestDto request)
        {
            ValidateProductReviewRequest(request.Rating, request.Content);

            var review = await LoadOwnedReviewForEditAsync(userId, reviewId);
            if (!CanEditWithinWindow(review.CreatedAt))
            {
                throw new BadRequestException("The edit window for this review has closed.");
            }

            review.Rating = request.Rating;
            review.Title = NormalizeOptionalText(request.Title);
            review.Comment = request.Content.Trim();
            review.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await PopulateReviewPresentationAsync(review);
            return MapPublicReview(review);
        }

        public async Task<ProductReviewItemResponseDto> UploadReviewMediaAsync(int userId, int reviewId, IReadOnlyCollection<IFormFile> files)
        {
            if (files == null || files.Count == 0)
            {
                throw new BadRequestException("Select at least one image or video to upload.");
            }

            var review = await LoadOwnedReviewForEditAsync(userId, reviewId);
            if (!CanEditWithinWindow(review.CreatedAt))
            {
                throw new BadRequestException("The edit window for this review has closed.");
            }

            var currentMedia = review.Images ?? new List<string>();
            if (currentMedia.Count + files.Count > MaxReviewMediaItems)
            {
                throw new BadRequestException($"A review can include up to {MaxReviewMediaItems} media items.");
            }

            foreach (var file in files)
            {
                var savedPath = await _fileService.SaveFileAsync(file, "reviews", ReviewMediaExtensions, ReviewMediaMaxFileSize);
                currentMedia.Add(savedPath);
            }

            review.Images = currentMedia;
            review.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await PopulateReviewPresentationAsync(review);
            return MapPublicReview(review);
        }

        public async Task<ProductReviewItemResponseDto> RemoveReviewMediaAsync(int userId, int reviewId, string mediaUrl)
        {
            if (string.IsNullOrWhiteSpace(mediaUrl))
            {
                throw new BadRequestException("A media URL is required.");
            }

            var review = await LoadOwnedReviewForEditAsync(userId, reviewId);
            if (!CanEditWithinWindow(review.CreatedAt))
            {
                throw new BadRequestException("The edit window for this review has closed.");
            }

            var currentMedia = review.Images ?? new List<string>();
            var match = currentMedia.FirstOrDefault(item => string.Equals(item, mediaUrl, StringComparison.OrdinalIgnoreCase));
            if (match == null)
            {
                throw new NotFoundException("Review media not found.");
            }

            currentMedia.Remove(match);
            review.Images = currentMedia;
            review.UpdatedAt = DateTime.UtcNow;
            _fileService.DeleteFile(match);

            await _context.SaveChangesAsync();
            await PopulateReviewPresentationAsync(review);
            return MapPublicReview(review);
        }

        public async Task<ProductReviewItemResponseDto> MarkReviewHelpfulAsync(int userId, int reviewId)
        {
            var review = await LoadReviewForInteractionAsync(reviewId);
            if (review.ReviewerId == userId)
            {
                throw new BadRequestException("You cannot mark your own review as helpful.");
            }

            var existingVote = await _context.ReviewHelpfulVotes
                .FirstOrDefaultAsync(vote => vote.ReviewId == reviewId && vote.UserId == userId);

            if (existingVote == null)
            {
                _context.ReviewHelpfulVotes.Add(new ReviewHelpfulVote
                {
                    ReviewId = reviewId,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            review.HelpfulCount = await _context.ReviewHelpfulVotes.CountAsync(vote => vote.ReviewId == reviewId);
            await _context.SaveChangesAsync();
            await PopulateReviewPresentationAsync(review);
            return MapPublicReview(review, new HashSet<int> { reviewId });
        }

        public async Task<ProductReviewItemResponseDto> UnmarkReviewHelpfulAsync(int userId, int reviewId)
        {
            var review = await LoadReviewForInteractionAsync(reviewId);
            var existingVote = await _context.ReviewHelpfulVotes
                .FirstOrDefaultAsync(vote => vote.ReviewId == reviewId && vote.UserId == userId);

            if (existingVote != null)
            {
                _context.ReviewHelpfulVotes.Remove(existingVote);
                await _context.SaveChangesAsync();
            }

            review.HelpfulCount = await _context.ReviewHelpfulVotes.CountAsync(vote => vote.ReviewId == reviewId);
            await _context.SaveChangesAsync();
            await PopulateReviewPresentationAsync(review);
            return MapPublicReview(review);
        }

        public async Task ReportReviewAsync(int userId, int reviewId, ReportReviewRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new BadRequestException("A report reason is required.");
            }

            var reviewExists = await _context.Reviews
                .AsNoTracking()
                .AnyAsync(review => review.Id == reviewId && (review.Status ?? "published") == "published");

            if (!reviewExists)
            {
                throw new NotFoundException("Review not found.");
            }

            var now = DateTime.UtcNow;
            var existingReport = await _context.ReviewReports
                .FirstOrDefaultAsync(report => report.ReviewId == reviewId && report.ReporterId == userId);

            if (existingReport == null)
            {
                _context.ReviewReports.Add(new ReviewReport
                {
                    ReviewId = reviewId,
                    ReporterId = userId,
                    Reason = request.Reason.Trim(),
                    Details = NormalizeOptionalText(request.Details),
                    Status = "open",
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
            else
            {
                existingReport.Reason = request.Reason.Trim();
                existingReport.Details = NormalizeOptionalText(request.Details);
                existingReport.Status = "open";
                existingReport.UpdatedAt = now;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<ProductReviewFeedResponseDto> GetProductReviewsAsync(int productId, int? currentUserId, string? sortBy, int? ratingFilter, int page, int pageSize)
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 10 : Math.Min(pageSize, 50);

            var baseQuery = _context.Reviews
                .AsNoTracking()
                .Include(review => review.Reviewer)
                .Include(review => review.SellerReplyByUser)
                .Where(review => review.ProductId == productId && (review.Status ?? "published") == "published");

            if (ratingFilter.HasValue && ratingFilter.Value >= 1 && ratingFilter.Value <= 5)
            {
                baseQuery = baseQuery.Where(review => review.Rating == ratingFilter.Value);
            }

            var summarySource = await _context.Reviews
                .AsNoTracking()
                .Where(review => review.ProductId == productId && (review.Status ?? "published") == "published")
                .ToListAsync();

            var normalizedSort = string.IsNullOrWhiteSpace(sortBy)
                ? "most_recent"
                : sortBy.Trim().ToLowerInvariant();

            baseQuery = normalizedSort switch
            {
                "highest_rating" => baseQuery.OrderByDescending(review => review.Rating).ThenByDescending(review => review.CreatedAt),
                "lowest_rating" => baseQuery.OrderBy(review => review.Rating).ThenByDescending(review => review.CreatedAt),
                "most_helpful" => baseQuery.OrderByDescending(review => review.HelpfulCount ?? 0).ThenByDescending(review => review.CreatedAt),
                _ => baseQuery.OrderByDescending(review => review.CreatedAt)
            };

            var totalItems = await baseQuery.CountAsync();
            var reviews = await baseQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var helpfulReviewIds = await LoadHelpfulReviewIdsAsync(currentUserId, reviews.Select(review => review.Id).ToList());

            return new ProductReviewFeedResponseDto
            {
                Summary = BuildProductSummary(summarySource),
                Items = reviews.Select(review => MapPublicReview(review, helpfulReviewIds)).ToList(),
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<BuyerReviewDashboardResponseDto> GetBuyerReviewDashboardAsync(int userId)
        {
            var pendingOrders = await _context.Orders
                .AsNoTracking()
                .Include(order => order.ShippingInfo)
                .Include(order => order.OrderItems)
                    .ThenInclude(item => item.Product)
                .Include(order => order.OrderItems)
                    .ThenInclude(item => item.Seller)
                .Where(order => order.BuyerId == userId)
                .OrderByDescending(order => order.CreatedAt)
                .ToListAsync();

            var pendingItems = new List<ReviewEligibilityResponseDto>();
            foreach (var order in pendingOrders)
            {
                var orderPending = await GetOrderReviewEligibilityAsync(userId, order.Id);
                pendingItems.AddRange(orderPending.Where(item => item.CanReviewProduct || item.CanLeaveSellerFeedback));
            }

            var productReviews = await _context.Reviews
                .AsNoTracking()
                .Include(review => review.OrderItem)
                    .ThenInclude(item => item!.Product)
                .Include(review => review.SellerReplyByUser)
                .Where(review => review.ReviewerId == userId)
                .OrderByDescending(review => review.UpdatedAt ?? review.CreatedAt)
                .ToListAsync();

            var sellerFeedback = await _context.SellerTransactionFeedbacks
                .AsNoTracking()
                .Include(feedback => feedback.OrderItem)
                    .ThenInclude(item => item.Product)
                .Include(feedback => feedback.Seller)
                .Where(feedback => feedback.BuyerId == userId)
                .OrderByDescending(feedback => feedback.UpdatedAt ?? feedback.CreatedAt)
                .ToListAsync();

            return new BuyerReviewDashboardResponseDto
            {
                PendingItems = pendingItems
                    .OrderByDescending(item => item.DeliveredAt ?? DateTime.MinValue)
                    .ToList(),
                ProductReviews = productReviews.Select(MapBuyerProductReview).ToList(),
                SellerFeedback = sellerFeedback.Select(MapBuyerSellerFeedback).ToList()
            };
        }

        public async Task<List<SellerReviewQueueItemResponseDto>> GetSellerReviewQueueAsync(int sellerId)
        {
            var reviews = await _context.Reviews
                .AsNoTracking()
                .Include(review => review.Product)
                .Include(review => review.Reviewer)
                .Include(review => review.SellerReplyByUser)
                .Where(review => review.Product.SellerId == sellerId && (review.Status ?? "published") == "published")
                .OrderByDescending(review => review.CreatedAt)
                .ToListAsync();

            return reviews.Select(MapSellerReviewQueueItem).ToList();
        }

        public async Task<ProductReviewItemResponseDto> ReplyToReviewAsync(int sellerId, int reviewId, SellerReplyRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Reply))
            {
                throw new BadRequestException("A seller reply is required.");
            }

            var review = await _context.Reviews
                .Include(item => item.Product)
                .Include(item => item.Reviewer)
                .Include(item => item.SellerReplyByUser)
                .FirstOrDefaultAsync(item => item.Id == reviewId);

            if (review == null)
            {
                throw new NotFoundException("Review not found.");
            }

            if (review.Product.SellerId != sellerId)
            {
                throw new NotFoundException("Review not found.");
            }

            var now = DateTime.UtcNow;
            review.SellerReply = request.Reply.Trim();
            review.SellerReplyByUserId = sellerId;
            review.SellerReplyCreatedAt ??= now;
            review.SellerReplyUpdatedAt = now;

            await _context.SaveChangesAsync();
            await CreateNotificationAsync(
                review.ReviewerId,
                "seller_reply",
                "Seller replied",
                $"A seller replied to your review on {review.Product?.Title ?? "a product"}.",
                $"/products/{review.ProductId}");
            await PopulateReviewPresentationAsync(review);
            return MapPublicReview(review);
        }

        public async Task<BuyerSellerFeedbackResponseDto> CreateSellerFeedbackAsync(int userId, CreateSellerFeedbackRequestDto request)
        {
            ValidateSellerFeedbackRequest(request.Sentiment, request.Comment);

            var orderItem = await LoadOrderItemForBuyerAsync(userId, request.OrderItemId);
            var existingFeedback = await _context.SellerTransactionFeedbacks
                .FirstOrDefaultAsync(feedback => feedback.BuyerId == userId && feedback.OrderItemId == orderItem.Id);

            var eligibility = EvaluateSellerFeedbackEligibility(orderItem.Order, orderItem, existingFeedback);
            if (!eligibility.Eligible)
            {
                throw new BadRequestException(eligibility.Reason);
            }

            var now = DateTime.UtcNow;
            var feedback = new SellerTransactionFeedback
            {
                OrderId = orderItem.OrderId,
                OrderItemId = orderItem.Id,
                SellerId = orderItem.SellerId,
                BuyerId = userId,
                Sentiment = NormalizeSentiment(request.Sentiment),
                Comment = request.Comment.Trim(),
                Status = "published",
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.SellerTransactionFeedbacks.Add(feedback);
            await _context.SaveChangesAsync();
            await CreateNotificationAsync(
                orderItem.SellerId,
                "seller_feedback_received",
                "New seller feedback",
                $"A buyer left {NormalizeSentiment(request.Sentiment)} feedback for {orderItem.ProductTitleSnapshot ?? orderItem.Product?.Title ?? "your sale"}.",
                "/seller/reviews");
            await RebuildSellerFeedbackAggregateAsync(orderItem.SellerId);

            await _context.Entry(feedback).Reference(item => item.Seller).LoadAsync();
            await _context.Entry(feedback).Reference(item => item.OrderItem).LoadAsync();
            await _context.Entry(feedback.OrderItem).Reference(item => item.Product).LoadAsync();

            return MapBuyerSellerFeedback(feedback);
        }

        public async Task<BuyerSellerFeedbackResponseDto> UpdateSellerFeedbackAsync(int userId, int feedbackId, UpdateSellerFeedbackRequestDto request)
        {
            ValidateSellerFeedbackRequest(request.Sentiment, request.Comment);

            var feedback = await _context.SellerTransactionFeedbacks
                .Include(existing => existing.Seller)
                .Include(existing => existing.OrderItem)
                    .ThenInclude(item => item.Product)
                .FirstOrDefaultAsync(existing => existing.Id == feedbackId && existing.BuyerId == userId);

            if (feedback == null)
            {
                throw new NotFoundException("Seller feedback not found.");
            }

            if (!CanEditWithinWindow(feedback.CreatedAt))
            {
                throw new BadRequestException("The edit window for this feedback has closed.");
            }

            feedback.Sentiment = NormalizeSentiment(request.Sentiment);
            feedback.Comment = request.Comment.Trim();
            feedback.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await RebuildSellerFeedbackAggregateAsync(feedback.SellerId);

            return MapBuyerSellerFeedback(feedback);
        }

        private async Task<OrderItem> LoadOrderItemForBuyerAsync(int userId, int orderItemId)
        {
            var orderItem = await _context.OrderItems
                .Include(item => item.Order)
                    .ThenInclude(order => order!.ShippingInfo)
                .Include(item => item.Product)
                .Include(item => item.Seller)
                .FirstOrDefaultAsync(item => item.Id == orderItemId && item.Order.BuyerId == userId);

            if (orderItem == null)
            {
                throw new NotFoundException("Order item not found.");
            }

            return orderItem;
        }

        private async Task<Review> LoadOwnedReviewForEditAsync(int userId, int reviewId)
        {
            var review = await _context.Reviews
                .Include(item => item.Order)
                    .ThenInclude(order => order!.ShippingInfo)
                .Include(item => item.OrderItem)
                .Include(item => item.Reviewer)
                .Include(item => item.SellerReplyByUser)
                .FirstOrDefaultAsync(item => item.Id == reviewId && item.ReviewerId == userId);

            if (review == null)
            {
                throw new NotFoundException("Review not found.");
            }

            return review;
        }

        private async Task<Review> LoadReviewForInteractionAsync(int reviewId)
        {
            var review = await _context.Reviews
                .Include(item => item.Reviewer)
                .Include(item => item.SellerReplyByUser)
                .FirstOrDefaultAsync(item => item.Id == reviewId && (item.Status ?? "published") == "published");

            if (review == null)
            {
                throw new NotFoundException("Review not found.");
            }

            return review;
        }

        private async Task PopulateReviewPresentationAsync(Review review)
        {
            if (review.Reviewer == null)
            {
                await _context.Entry(review).Reference(item => item.Reviewer).LoadAsync();
            }

            if (review.SellerReplyByUserId.HasValue && review.SellerReplyByUser == null)
            {
                await _context.Entry(review).Reference(item => item.SellerReplyByUser).LoadAsync();
            }
        }

        private async Task<HashSet<int>> LoadHelpfulReviewIdsAsync(int? currentUserId, List<int> reviewIds)
        {
            if (!currentUserId.HasValue || reviewIds.Count == 0)
            {
                return new HashSet<int>();
            }

            var helpfulIds = await _context.ReviewHelpfulVotes
                .AsNoTracking()
                .Where(vote => vote.UserId == currentUserId.Value && reviewIds.Contains(vote.ReviewId))
                .Select(vote => vote.ReviewId)
                .ToListAsync();

            return helpfulIds.ToHashSet();
        }

        private async Task CreateNotificationAsync(int userId, string type, string title, string body, string? link)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Body = body,
                Link = link,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }

        private static (bool Eligible, string Reason) EvaluateProductReviewEligibility(Order order, OrderItem orderItem, Review? existingReview)
        {
            if (existingReview != null)
            {
                return (false, "You already reviewed this item.");
            }

            if (!IsDelivered(order))
            {
                return (false, "This order item is not eligible yet because the order has not been delivered.");
            }

            var deliveredAt = ResolveDeliveredAt(order);
            if (deliveredAt.HasValue && deliveredAt.Value.AddDays(ReviewWindowDays) < DateTime.UtcNow)
            {
                return (false, "The review window for this item has already closed.");
            }

            if (string.Equals(order.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
            {
                return (false, "Cancelled orders cannot be reviewed.");
            }

            if (orderItem.Quantity <= 0)
            {
                return (false, "This order item is not reviewable.");
            }

            return (true, "You can leave a verified product review for this item.");
        }

        private static (bool Eligible, string Reason) EvaluateSellerFeedbackEligibility(Order order, OrderItem orderItem, SellerTransactionFeedback? existingFeedback)
        {
            if (existingFeedback != null)
            {
                return (false, "You already left seller feedback for this transaction.");
            }

            if (!IsDelivered(order))
            {
                return (false, "Seller feedback becomes available after delivery is completed.");
            }

            var deliveredAt = ResolveDeliveredAt(order);
            if (deliveredAt.HasValue && deliveredAt.Value.AddDays(ReviewWindowDays) < DateTime.UtcNow)
            {
                return (false, "The seller feedback window for this transaction has closed.");
            }

            if (string.Equals(order.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
            {
                return (false, "Cancelled orders cannot receive seller feedback.");
            }

            if (orderItem.SellerId <= 0)
            {
                return (false, "Seller feedback is not available for this item.");
            }

            return (true, "You can leave transaction feedback for this seller.");
        }

        private async Task RebuildSellerFeedbackAggregateAsync(int sellerId)
        {
            var feedbackItems = await _context.SellerTransactionFeedbacks
                .Where(feedback => feedback.SellerId == sellerId && feedback.Status == "published")
                .ToListAsync();

            var aggregate = await _context.SellerFeedbacks
                .FirstOrDefaultAsync(entry => entry.SellerId == sellerId);

            if (aggregate == null)
            {
                aggregate = new SellerFeedback
                {
                    SellerId = sellerId
                };
                _context.SellerFeedbacks.Add(aggregate);
            }

            aggregate.TotalReviews = feedbackItems.Count;
            aggregate.PositiveCount = feedbackItems.Count(feedback => feedback.Sentiment == "positive");
            aggregate.NeutralCount = feedbackItems.Count(feedback => feedback.Sentiment == "neutral");
            aggregate.NegativeCount = feedbackItems.Count(feedback => feedback.Sentiment == "negative");
            aggregate.AverageRating = feedbackItems.Count == 0
                ? 0m
                : Math.Round((decimal)feedbackItems.Average(feedback => SentimentToScore(feedback.Sentiment)), 2, MidpointRounding.AwayFromZero);
            aggregate.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private static ProductReviewSummaryResponseDto BuildProductSummary(List<Review> reviews)
        {
            var publishedReviews = reviews
                .Where(review => (review.Status ?? "published") == "published")
                .ToList();

            var breakdown = Enumerable.Range(1, 5)
                .ToDictionary(star => star, star => publishedReviews.Count(review => review.Rating == star));

            return new ProductReviewSummaryResponseDto
            {
                AverageRating = publishedReviews.Count == 0
                    ? 0m
                    : Math.Round((decimal)publishedReviews.Average(review => review.Rating), 2, MidpointRounding.AwayFromZero),
                TotalReviews = publishedReviews.Count,
                RatingBreakdown = breakdown
            };
        }

        private static ProductReviewItemResponseDto MapPublicReview(Review review, HashSet<int>? helpfulReviewIds = null)
        {
            return new ProductReviewItemResponseDto
            {
                Id = review.Id,
                ProductId = review.ProductId,
                OrderId = review.OrderId ?? 0,
                OrderItemId = review.OrderItemId,
                Rating = review.Rating,
                Title = review.Title,
                Content = review.Comment ?? string.Empty,
                ReviewerDisplayName = MaskDisplayName(review.Reviewer?.Username),
                IsVerifiedPurchase = review.IsVerifiedPurchase ?? false,
                HelpfulCount = review.HelpfulCount ?? 0,
                Status = review.Status ?? "published",
                CreatedAt = review.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = review.UpdatedAt,
                IsEdited = review.UpdatedAt.HasValue && review.CreatedAt.HasValue && review.UpdatedAt.Value > review.CreatedAt.Value.AddMinutes(1),
                MediaUrls = review.Images ?? new List<string>(),
                MediaItems = BuildMediaItems(review.Images),
                HasMarkedHelpful = helpfulReviewIds?.Contains(review.Id) == true,
                SellerReply = BuildSellerReply(review)
            };
        }

        private static BuyerProductReviewResponseDto MapBuyerProductReview(Review review)
        {
            return new BuyerProductReviewResponseDto
            {
                Id = review.Id,
                ProductId = review.ProductId,
                ProductTitle = review.OrderItem?.ProductTitleSnapshot ?? review.OrderItem?.Product?.Title ?? "Product",
                ProductImage = review.OrderItem?.ProductImageSnapshot ?? review.OrderItem?.Product?.Images?.FirstOrDefault(),
                OrderId = review.OrderId ?? 0,
                OrderItemId = review.OrderItemId,
                Rating = review.Rating,
                Title = review.Title,
                Content = review.Comment ?? string.Empty,
                Status = review.Status ?? "published",
                CreatedAt = review.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = review.UpdatedAt,
                CanEdit = CanEditWithinWindow(review.CreatedAt),
                MediaUrls = review.Images ?? new List<string>(),
                MediaItems = BuildMediaItems(review.Images),
                SellerReply = BuildSellerReply(review)
            };
        }

        private static BuyerSellerFeedbackResponseDto MapBuyerSellerFeedback(SellerTransactionFeedback feedback)
        {
            return new BuyerSellerFeedbackResponseDto
            {
                Id = feedback.Id,
                OrderId = feedback.OrderId,
                OrderItemId = feedback.OrderItemId,
                ProductId = feedback.OrderItem?.ProductId ?? 0,
                ProductTitle = feedback.OrderItem?.ProductTitleSnapshot ?? feedback.OrderItem?.Product?.Title ?? "Product",
                ProductImage = feedback.OrderItem?.ProductImageSnapshot ?? feedback.OrderItem?.Product?.Images?.FirstOrDefault(),
                SellerId = feedback.SellerId,
                SellerName = feedback.OrderItem?.SellerDisplayNameSnapshot ?? feedback.Seller?.Username ?? "Seller",
                Sentiment = feedback.Sentiment,
                Comment = feedback.Comment ?? string.Empty,
                Status = feedback.Status,
                CreatedAt = feedback.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = feedback.UpdatedAt,
                CanEdit = CanEditWithinWindow(feedback.CreatedAt)
            };
        }

        private static SellerReviewQueueItemResponseDto MapSellerReviewQueueItem(Review review)
        {
            return new SellerReviewQueueItemResponseDto
            {
                ReviewId = review.Id,
                ProductId = review.ProductId,
                ProductTitle = review.Product?.Title ?? "Product",
                ProductImage = review.Product?.Images?.FirstOrDefault(),
                ReviewerDisplayName = MaskDisplayName(review.Reviewer?.Username),
                Rating = review.Rating,
                Title = review.Title,
                Content = review.Comment ?? string.Empty,
                IsVerifiedPurchase = review.IsVerifiedPurchase ?? false,
                HelpfulCount = review.HelpfulCount ?? 0,
                CreatedAt = review.CreatedAt ?? DateTime.UtcNow,
                MediaItems = BuildMediaItems(review.Images),
                SellerReply = BuildSellerReply(review),
                CanReply = true
            };
        }

        private static SellerReplyResponseDto? BuildSellerReply(Review review)
        {
            if (string.IsNullOrWhiteSpace(review.SellerReply))
            {
                return null;
            }

            return new SellerReplyResponseDto
            {
                Reply = review.SellerReply,
                SellerDisplayName = review.SellerReplyByUser?.Username ?? "Seller",
                CreatedAt = review.SellerReplyCreatedAt ?? review.UpdatedAt ?? review.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = review.SellerReplyUpdatedAt,
                IsEdited = review.SellerReplyUpdatedAt.HasValue
                    && review.SellerReplyCreatedAt.HasValue
                    && review.SellerReplyUpdatedAt.Value > review.SellerReplyCreatedAt.Value.AddMinutes(1)
            };
        }

        private static List<ReviewMediaItemResponseDto> BuildMediaItems(List<string>? mediaUrls)
        {
            return (mediaUrls ?? new List<string>())
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Select(url => new ReviewMediaItemResponseDto
                {
                    Url = url,
                    MediaType = DetectMediaType(url)
                })
                .ToList();
        }

        private static string DetectMediaType(string url)
        {
            var extension = Path.GetExtension(url ?? string.Empty).ToLowerInvariant();
            return extension switch
            {
                ".mp4" or ".mov" or ".webm" or ".ogg" => "video",
                _ => "image"
            };
        }

        private static string MaskDisplayName(string? username)
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                return "Verified buyer";
            }

            return username.Length <= 2
                ? username
                : $"{username[0]}***{username[^1]}";
        }

        private static bool IsDelivered(Order order)
        {
            var status = (order.Status ?? string.Empty).Trim().ToLowerInvariant();
            return status is "delivered" or "completed" || order.ShippingInfo?.DeliveredAt.HasValue == true;
        }

        private static DateTime? ResolveDeliveredAt(Order order)
        {
            return order.ShippingInfo?.DeliveredAt
                ?? (IsDelivered(order) ? order.UpdatedAt ?? order.CreatedAt ?? order.OrderDate : null);
        }

        private static bool CanEditWithinWindow(DateTime? createdAt)
        {
            return createdAt.HasValue && createdAt.Value.AddDays(EditWindowDays) >= DateTime.UtcNow;
        }

        private static void ValidateProductReviewRequest(int rating, string content)
        {
            if (rating < 1 || rating > 5)
            {
                throw new BadRequestException("Product review rating must be between 1 and 5 stars.");
            }

            if (string.IsNullOrWhiteSpace(content))
            {
                throw new BadRequestException("Product review content is required.");
            }
        }

        private static void ValidateSellerFeedbackRequest(string sentiment, string comment)
        {
            var normalizedSentiment = NormalizeSentiment(sentiment);
            if (normalizedSentiment is not ("positive" or "neutral" or "negative"))
            {
                throw new BadRequestException("Seller feedback sentiment must be positive, neutral, or negative.");
            }

            if (string.IsNullOrWhiteSpace(comment))
            {
                throw new BadRequestException("Seller feedback comment is required.");
            }
        }

        private static string NormalizeSentiment(string? sentiment)
        {
            return string.IsNullOrWhiteSpace(sentiment)
                ? string.Empty
                : sentiment.Trim().ToLowerInvariant();
        }

        private static string? NormalizeOptionalText(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static int SentimentToScore(string sentiment)
        {
            return sentiment switch
            {
                "positive" => 5,
                "neutral" => 3,
                "negative" => 1,
                _ => 0
            };
        }
    }
}
