// Services/EnrollmentService.cs - FIXED VERSION
using MongoDB.Driver;
using TrainingSystem.Models;

namespace TrainingSystem.Services
{
    public class EnrollmentService
    {
        private readonly IMongoCollection<Enrollment> _enrollments;

        public EnrollmentService(IMongoDatabase database)
        {
            _enrollments = database.GetCollection<Enrollment>("Enrollments");
        }

        public async Task<List<Enrollment>> GetAllEnrollmentsAsync()
        {
            try
            {
                return await _enrollments.Find(_ => true).ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving enrollments: {ex.Message}", ex);
            }
        }

        public async Task<Enrollment> GetEnrollmentByIdAsync(string id)
        {
            try
            {
                return await _enrollments.Find(e => e.Id == id).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving enrollment by ID: {ex.Message}", ex);
            }
        }

        public async Task<List<Enrollment>> GetEnrollmentsByUserIdAsync(string userId)
        {
            try
            {
                return await _enrollments.Find(e => e.UserId == userId).ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving enrollments for user: {ex.Message}", ex);
            }
        }

        public async Task<List<Enrollment>> GetEnrollmentsByCourseIdAsync(string courseId)
        {
            try
            {
                return await _enrollments.Find(e => e.CourseId == courseId).ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving enrollments for course: {ex.Message}", ex);
            }
        }

        public async Task<Enrollment> CreateEnrollmentAsync(Enrollment enrollment)
        {
            try
            {
                await _enrollments.InsertOneAsync(enrollment);
                return enrollment;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error creating enrollment: {ex.Message}", ex);
            }
        }

        public async Task<bool> UpdateEnrollmentAsync(string id, Enrollment enrollment)
        {
            try
            {
                var result = await _enrollments.ReplaceOneAsync(e => e.Id == id, enrollment);
                return result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error updating enrollment: {ex.Message}", ex);
            }
        }

        public async Task<bool> UpdateProgressAsync(string id, int progress)
        {
            try
            {
                var update = Builders<Enrollment>.Update
                    .Set(e => e.Progress, progress);

                // Update status based on progress
                if (progress >= 100)
                {
                    update = update
                        .Set(e => e.Status, EnrollmentStatus.Completed)
                        .Set(e => e.CompletedAt, DateTime.UtcNow);
                }
                else if (progress > 0)
                {
                    update = update.Set(e => e.Status, EnrollmentStatus.InProgress);
                }

                var result = await _enrollments.UpdateOneAsync(e => e.Id == id, update);
                return result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error updating progress: {ex.Message}", ex);
            }
        }

        public async Task<bool> DeleteEnrollmentAsync(string id)
        {
            try
            {
                var result = await _enrollments.DeleteOneAsync(e => e.Id == id);
                return result.DeletedCount > 0;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting enrollment: {ex.Message}", ex);
            }
        }

        public async Task<bool> EnrollmentExistsAsync(string userId, string courseId)
        {
            try
            {
                var enrollment = await _enrollments.Find(e => e.UserId == userId && e.CourseId == courseId).FirstOrDefaultAsync();
                return enrollment != null;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error checking enrollment existence: {ex.Message}", ex);
            }
        }
    }
}