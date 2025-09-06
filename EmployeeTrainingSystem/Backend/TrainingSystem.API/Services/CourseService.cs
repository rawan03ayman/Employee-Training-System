// Services/CourseService.cs
using MongoDB.Driver;
using TrainingSystem.Models;

namespace TrainingSystem.Services
{
    public class CourseService
    {
        private readonly IMongoCollection<Course> _courses;

        public CourseService(IMongoDatabase database)
        {
            _courses = database.GetCollection<Course>("Courses");
        }

        public async Task<List<Course>> GetAllCoursesAsync()
        {
            return await _courses.Find(c => c.IsActive).ToListAsync();
        }

        public async Task<Course> GetCourseByIdAsync(string id)
        {
            return await _courses.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Course> CreateCourseAsync(Course course)
        {
            await _courses.InsertOneAsync(course);
            return course;
        }

        public async Task<bool> UpdateCourseAsync(string id, Course course)
        {
            var result = await _courses.ReplaceOneAsync(c => c.Id == id, course);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteCourseAsync(string id)
        {
            var update = Builders<Course>.Update.Set(c => c.IsActive, false);
            var result = await _courses.UpdateOneAsync(c => c.Id == id, update);
            return result.ModifiedCount > 0;
        }

        public async Task<List<Course>> GetCoursesByCategory(string category)
        {
            return await _courses.Find(c => c.Category == category && c.IsActive).ToListAsync();
        }
    }
}