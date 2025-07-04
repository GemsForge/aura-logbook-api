﻿using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto
{
    public class UpdateUserRequest
    {
        [Required]
        public int Id { get; set; }

        [EmailAddress]
        public string Email { get; set; } = default!;

        [MinLength(6)]
        public string? Password { get; set; }  // ✅ Now optional

        [MaxLength(30)]
        public string? DisplayName { get; set; }

        public DateOnly Birthday { get; set; }

        public string? AuraColor { get; set; }
        public int? AuraIntensity { get; set; }

        public string? Avatar { get; set; }
        public string? Motto { get; set; }
        public List<SpiritualPathway> SpiritualPathways { get; set; } = new();
    }
}