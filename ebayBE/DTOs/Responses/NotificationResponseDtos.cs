namespace ebay.DTOs.Responses
{
    public class NotificationItemResponseDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? Link { get; set; }
        public bool IsRead { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class NotificationListResponseDto
    {
        public List<NotificationItemResponseDto> Items { get; set; } = [];
        public int UnreadCount { get; set; }
    }
}
