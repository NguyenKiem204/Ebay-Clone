using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Banner
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? CtaText { get; set; }

    public string? ImageUrl { get; set; }

    public string? LinkUrl { get; set; }

    public string? BgColor { get; set; }

    public string? TextColor { get; set; }

    public string? Type { get; set; }

    public string? Items { get; set; }

    public int? DisplayOrder { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
