namespace ebay.Attributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public class RateLimitAttribute : Attribute
    {
        public string Name { get; }
        public int Limit { get; }
        public TimeSpan Period { get; }

        public RateLimitAttribute(string name, int limit, int periodInSeconds)
        {
            Name = name;
            Limit = limit;
            Period = TimeSpan.FromSeconds(periodInSeconds);
        }

        public RateLimitAttribute(string name, int limit, int value, RateLimitPeriod period)
        {
            Name = name;
            Limit = limit;
            Period = period switch
            {
                RateLimitPeriod.Second => TimeSpan.FromSeconds(value),
                RateLimitPeriod.Minute => TimeSpan.FromMinutes(value),
                RateLimitPeriod.Hour => TimeSpan.FromHours(value),
                RateLimitPeriod.Day => TimeSpan.FromDays(value),
                _ => TimeSpan.FromMinutes(value)
            };
        }
    }

    public enum RateLimitPeriod
    {
        Second,
        Minute,
        Hour,
        Day
    }
}
