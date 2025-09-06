// Services/ProgressService.cs
using MongoDB.Driver;
using TrainingSystem.Models;

namespace TrainingSystem.Services
{
    public class ProgressService
    {
        private readonly IMongoCollection<Progress> _progress;

        public ProgressService(IMongoDatabase database)
        {
            _progress = database.GetCollection<Progress>("Progress");
        }

        public async Task<List<Progress>> GetProgressByUserIdAsync(string userId)
        {
            return await _progress.Find(p => p.UserId == userId).ToListAsync();
        }

        public async Task<Progress> GetProgressByEnrollmentIdAsync(string enrollmentId)
        {
            return await _progress.Find(p => p.EnrollmentId == enrollmentId).FirstOrDefaultAsync();
        }

        public async Task<Progress> CreateProgressAsync(Progress progress)
        {
            await _progress.InsertOneAsync(progress);
            return progress;
        }

        public async Task<bool> UpdateProgressAsync(string id, Progress progress)
        {
            var result = await _progress.ReplaceOneAsync(p => p.Id == id, progress);
            return result.ModifiedCount > 0;
        }
    }

    public class Progress
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string EnrollmentId { get; set; }
        public string CourseId { get; set; }
        public List<ModuleProgress> ModulesProgress { get; set; } = new List<ModuleProgress>();
        public int OverallProgress { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class ModuleProgress
    {
        public string ModuleId { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int TimeSpent { get; set; } // in minutes
    }
}
