using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class CartService : ICartService
    {
        private readonly EbayDbContext _context;

        public CartService(EbayDbContext context)
        {
            _context = context;
        }

        public async Task<CartResponseDto> GetCartAsync(int userId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            await RemoveIneligibleCartItemsAsync(cart, userId);
            
            var items = cart.CartItems.Select(ci => new CartItemResponseDto
            {
                Id = ci.Id,
                ProductId = ci.ProductId,
                ProductName = ci.Product.Title,
                ProductSlug = ci.Product.Slug,
                ProductImage = ci.Product.Images != null && ci.Product.Images.Count > 0 ? ci.Product.Images[0] : null,
                UnitPrice = ci.Product.Price,
                Quantity = ci.Quantity,
                Stock = ci.Product.Stock ?? 0,
                ShippingFee = ci.Product.ShippingFee ?? 0,
                SellerId = ci.Product.SellerId,
                SellerName = ci.Product.Seller?.Username ?? "Unknown"
            }).ToList();

            return new CartResponseDto
            {
                Items = items,
                Subtotal = items.Sum(i => i.TotalPrice),
                TotalShipping = items.Sum(i => i.ShippingFee),
                TotalItems = items.Sum(i => i.Quantity)
            };
        }

        public async Task AddToCartAsync(int userId, AddToCartRequestDto request)
        {
            if (request.Quantity <= 0)
                throw new BadRequestException("Số lượng phải lớn hơn 0");

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null) throw new NotFoundException("Sản phẩm không tồn tại");
            ValidateCartEligibility(product, userId);

            var cart = await GetOrCreateCartAsync(userId);
            var cartItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == request.ProductId);

            if (cartItem != null)
            {
                cartItem.Quantity += request.Quantity;
                if (cartItem.Quantity > (product.Stock ?? 0))
                    throw new BadRequestException($"Không đủ hàng trong kho (Còn {product.Stock})");
                
                cartItem.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                if (request.Quantity > (product.Stock ?? 0))
                    throw new BadRequestException($"Không đủ hàng trong kho (Còn {product.Stock})");

                await _context.CartItems.AddAsync(new CartItem
                {
                    CartId = cart.Id,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
        }

        public async Task UpdateQuantityAsync(int userId, int productId, int quantity)
        {
            if (quantity <= 0)
            {
                await RemoveItemAsync(userId, productId);
                return;
            }

            var cart = await GetOrCreateCartAsync(userId);
            var cartItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == productId);

            if (cartItem == null) throw new NotFoundException("Sản phẩm không trong giỏ hàng");
            if (cartItem.Product == null)
            {
                _context.CartItems.Remove(cartItem);
                await _context.SaveChangesAsync();
                throw new BadRequestException("Sản phẩm không còn hợp lệ trong giỏ hàng");
            }

            if (cartItem.Product.IsAuction == true || cartItem.Product.SellerId == userId)
            {
                _context.CartItems.Remove(cartItem);
                await _context.SaveChangesAsync();

                throw new BadRequestException(
                    cartItem.Product.IsAuction == true
                        ? "Auction listing không thể nằm trong giỏ hàng"
                        : "Bạn không thể mua sản phẩm của chính mình");
            }

            if (quantity > (cartItem.Product.Stock ?? 0))
                throw new BadRequestException($"Không đủ hàng trong kho (Còn {cartItem.Product.Stock})");

            cartItem.Quantity = quantity;
            cartItem.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task RemoveItemAsync(int userId, int productId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            var cartItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == productId);

            if (cartItem != null)
            {
                _context.CartItems.Remove(cartItem);
                await _context.SaveChangesAsync();
            }
        }

        public async Task ClearCartAsync(int userId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            _context.CartItems.RemoveRange(cart.CartItems);
            await _context.SaveChangesAsync();
        }

        public async Task MergeCartAsync(int userId, List<AddToCartRequestDto> guestItems)
        {
            foreach (var item in guestItems)
            {
                try {
                    await AddToCartAsync(userId, item);
                } catch {
                    // Skip items that might have become invalid/out of stock
                }
            }
        }

        private async Task<Cart> GetOrCreateCartAsync(int userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                        .ThenInclude(p => p.Seller)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.Carts.AddAsync(cart);
                await _context.SaveChangesAsync();
                
                // Refresh to include empty CartItems list
                cart.CartItems = new List<CartItem>();
            }

            return cart;
        }

        private void ValidateCartEligibility(Product product, int userId)
        {
            if (product.IsAuction == true)
                throw new BadRequestException("Auction listing không thể thêm vào giỏ hàng");

            if (product.SellerId == userId)
                throw new BadRequestException("Bạn không thể mua sản phẩm của chính mình");

            if (product.IsActive != true || !string.Equals(product.Status, "active", StringComparison.OrdinalIgnoreCase))
                throw new BadRequestException("Sản phẩm không còn bán");

            if ((product.Stock ?? 0) <= 0)
                throw new BadRequestException("Sản phẩm đã hết hàng");
        }

        private async Task RemoveIneligibleCartItemsAsync(Cart cart, int userId)
        {
            var invalidItems = cart.CartItems
                .Where(ci => ci.Product == null || ci.Product.IsAuction == true || ci.Product.SellerId == userId)
                .ToList();

            if (!invalidItems.Any())
            {
                return;
            }

            foreach (var item in invalidItems)
            {
                cart.CartItems.Remove(item);
            }

            _context.CartItems.RemoveRange(invalidItems);
            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
