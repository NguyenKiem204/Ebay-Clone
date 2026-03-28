using FluentValidation;
using ebay.DTOs.Requests;
using ebay.Validators.Store;

namespace ebay.Validators.Product
{
    public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
    {
        public CreateProductRequestValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required")
                .MinimumLength(10).WithMessage("Title must be at least 10 characters")
                .MaximumLength(150).WithMessage("Title must not exceed 150 characters")
                .Must(StoreValidationHelpers.NotContainBadWords).WithMessage("Title contains invalid words");

            RuleFor(x => x.Description)
                .MaximumLength(5000).WithMessage("Description must not exceed 5000 characters")
                .Must(StoreValidationHelpers.NotContainBadWords).WithMessage("Description contains invalid words");

            RuleFor(x => x.Price)
                .GreaterThan(0).When(x => !x.IsAuction).WithMessage("Product price must be greater than 0");

            RuleFor(x => x.Stock)
                .GreaterThanOrEqualTo(0).WithMessage("Stock quantity cannot be negative");

            RuleFor(x => x.Stock)
                .Equal(1)
                .When(x => x.IsAuction)
                .WithMessage("Auction listings only support a stock quantity of 1");

            RuleFor(x => x.Condition)
                .NotEmpty().WithMessage("Product condition is required");

            RuleFor(x => x.CategoryId)
                .NotEmpty().WithMessage("Please select a category for the product");

            RuleFor(x => x.Images)
                .Must(x => x != null && x.Count > 0).WithMessage("Product must have at least 1 image")
                .Must(x => x == null || x.Count <= 24).WithMessage("Product cannot have more than 24 images");
            
            RuleFor(x => x.StartingBid)
                .GreaterThan(0).When(x => x.IsAuction).WithMessage("Auction starting bid must be greater than 0");

            RuleFor(x => x.ReservePrice)
                .GreaterThan(0).When(x => x.IsAuction && x.ReservePrice.HasValue)
                .WithMessage("Reserve price must be greater than 0");

            RuleFor(x => x)
                .Must(x => !x.IsAuction || !x.ReservePrice.HasValue || !x.StartingBid.HasValue || x.ReservePrice.Value >= x.StartingBid.Value)
                .WithMessage("Reserve price must be greater than or equal to the starting bid");

            RuleFor(x => x)
                .Must(x => !x.IsAuction || !x.BuyItNowPrice.HasValue || !x.StartingBid.HasValue || x.BuyItNowPrice.Value >= x.StartingBid.Value * 1.3m)
                .WithMessage("Buy It Now price must be >= 130% of the starting bid for auction + BIN listings");

            RuleFor(x => x.AuctionDurationMinutes)
                .InclusiveBetween(15, 14_400)
                .When(x => x.IsAuction && x.AuctionDurationMinutes.HasValue)
                .WithMessage("Auction duration must be between 15 minutes and 10 days");

            RuleFor(x => x.AuctionDurationDays)
                .Must(d => !d.HasValue || new[] { 1, 3, 5, 7, 10 }.Contains(d.Value))
                .When(x => x.IsAuction && !x.AuctionDurationMinutes.HasValue)
                .WithMessage("Auction duration only supports: 1, 3, 5, 7, or 10 days");
        }
    }

    public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
    {
        public UpdateProductRequestValidator()
        {
            RuleFor(x => x.Title)
                .MinimumLength(10).When(x => !string.IsNullOrEmpty(x.Title)).WithMessage("Title must be at least 10 characters")
                .MaximumLength(150).When(x => !string.IsNullOrEmpty(x.Title)).WithMessage("Title must not exceed 150 characters")
                .Must(StoreValidationHelpers.NotContainBadWords).When(x => !string.IsNullOrEmpty(x.Title)).WithMessage("Title contains invalid words");

            RuleFor(x => x.Description)
                .MaximumLength(5000).When(x => !string.IsNullOrEmpty(x.Description)).WithMessage("Description must not exceed 5000 characters")
                .Must(StoreValidationHelpers.NotContainBadWords).When(x => !string.IsNullOrEmpty(x.Description)).WithMessage("Description contains invalid words");

            RuleFor(x => x.Price)
                .GreaterThan(0).When(x => x.Price.HasValue && (!x.IsAuction.HasValue || !x.IsAuction.Value)).WithMessage("Product price must be greater than 0");

            RuleFor(x => x.Stock)
                .GreaterThanOrEqualTo(0).When(x => x.Stock.HasValue).WithMessage("Stock quantity cannot be negative");

            RuleFor(x => x.Stock)
                .Equal(1)
                .When(x => x.IsAuction == true && x.Stock.HasValue)
                .WithMessage("Auction listings only support a stock quantity of 1");

            RuleFor(x => x.StartingBid)
                .GreaterThan(0)
                .When(x => x.IsAuction == true && x.StartingBid.HasValue)
                .WithMessage("Auction starting bid must be greater than 0");

            RuleFor(x => x.ReservePrice)
                .GreaterThan(0)
                .When(x => x.IsAuction == true && x.ReservePrice.HasValue)
                .WithMessage("Reserve price must be greater than 0");

            RuleFor(x => x)
                .Must(x => x.IsAuction != true || !x.ReservePrice.HasValue || !x.StartingBid.HasValue || x.ReservePrice.Value >= x.StartingBid.Value)
                .WithMessage("Reserve price must be greater than or equal to the starting bid");

            RuleFor(x => x)
                .Must(x => x.IsAuction != true || !x.BuyItNowPrice.HasValue || !x.StartingBid.HasValue || x.BuyItNowPrice.Value >= x.StartingBid.Value * 1.3m)
                .WithMessage("Buy It Now price must be >= 130% of the starting bid for auction + BIN listings");

            RuleFor(x => x.AuctionDurationMinutes)
                .InclusiveBetween(15, 14_400)
                .When(x => x.IsAuction == true && x.AuctionDurationMinutes.HasValue)
                .WithMessage("Auction duration must be between 15 minutes and 10 days");

            RuleFor(x => x.AuctionDurationDays)
                .Must(d => !d.HasValue || new[] { 1, 3, 5, 7, 10 }.Contains(d.Value))
                .When(x => x.IsAuction == true && !x.AuctionDurationMinutes.HasValue)
                .WithMessage("Auction duration only supports: 1, 3, 5, 7, or 10 days");
        }
    }
}
