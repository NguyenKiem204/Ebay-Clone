namespace ebay.Configuration
{
    public static class NavCategoryConfig
    {
        public static readonly Dictionary<string, List<string>> NavGroups = new Dictionary<string, List<string>>
        {
            { "electronics", new List<string> { "laptops", "computer-parts", "smartphones", "enterprise-networking", "tablets-ebooks", "storage-blank-media", "lenses-filters", "tech-trending" } },
            { "motors", new List<string> { "automotive", "motors-trending" } },
            { "fashion", new List<string> { "fashion", "mens-clothing", "womens-clothing", "shoes", "luxury-trending" } },
            { "collectibles", new List<string> { "trading-cards-trending", "collectibles-art-trending", "books" } },
            { "sports", new List<string> { "sports-outdoors" } },
            { "health", new List<string> { "health-beauty-trending" } },
            { "industrial", new List<string>() },
            { "home", new List<string> { "home-garden", "home-garden-trending" } }
        };
        
        public static readonly Dictionary<string, string> NavGroupNames = new Dictionary<string, string>
        {
            { "electronics", "Electronics" },
            { "motors", "Motors" },
            { "fashion", "Fashion" },
            { "collectibles", "Collectibles and Art" },
            { "sports", "Sports" },
            { "health", "Health & Beauty" },
            { "industrial", "Industrial equipment" },
            { "home", "Home & Garden" }
        };
    }
}
