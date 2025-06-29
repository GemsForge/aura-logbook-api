﻿using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Models.Dto.Insights;

namespace AuraLogbook.Api.Services
{
    public interface IMoodService
    {
        Task<(bool Success, string Message)> CreateMoodAsync(int userId, MoodEntryRequest dto);
        Task<(bool Success, string Message)> DeleteMoodAsync(int userId, int moodId);
        Task<(bool Success, string Message)> UpdateMoodAsync(int userId, int moodId, MoodEntryRequest dto);
        Task<List<MoodEntry>> GetEntriesForUserAsync(int userId, DateTime? startDate = null, DateTime? endDate = null);

    }
}