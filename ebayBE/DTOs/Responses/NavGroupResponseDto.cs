namespace ebay.DTOs.Responses
{
    public class NavGroupResponseDto
    {
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public List<CategoryResponseDto> Categories { get; set; } = new();
    }
}
