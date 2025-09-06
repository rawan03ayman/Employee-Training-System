using MongoDB.Driver;
using TrainingSystem.Models;

namespace TrainingSystem.Services
{
    public class ReportService
    {
        private readonly IMongoCollection<Enrollment> _enrollments;
        private readonly IMongoCollection<Course> _courses;
        private readonly IMongoCollection<User> _users;

        public ReportService(IMongoDatabase database)
        {
            _enrollments = database.GetCollection<Enrollment>("Enrollments");
            _courses = database.GetCollection<Course>("Courses");
            _users = database.GetCollection<User>("Users");
        }

        public async Task<DashboardStats> GetDashboardStatsAsync()
        {
            var totalCourses = await _courses.CountDocumentsAsync(c => c.IsActive);
            var totalUsers = await _users.CountDocumentsAsync(u => u.Role == UserRole.Employee && u.IsActive);
            var totalEnrollments = await _enrollments.CountDocumentsAsync(_ => true);
            var completedEnrollments = await _enrollments.CountDocumentsAsync(e => e.Status == EnrollmentStatus.Completed);

            var completionRate = totalEnrollments > 0 ? (double)completedEnrollments / totalEnrollments * 100 : 0;

            return new DashboardStats
            {
                TotalCourses = (int)totalCourses,
                TotalUsers = (int)totalUsers,
                TotalEnrollments = (int)totalEnrollments,
                CompletionRate = Math.Round(completionRate, 2)
            };
        }

        public async Task<List<CourseCompletionReport>> GetCourseCompletionReportAsync()
        {
            var courses = await _courses.Find(c => c.IsActive).ToListAsync();
            var reports = new List<CourseCompletionReport>();

            foreach (var course in courses)
            {
                var totalEnrollments = await _enrollments.CountDocumentsAsync(e => e.CourseId == course.Id);
                var completedEnrollments = await _enrollments.CountDocumentsAsync(e => e.CourseId == course.Id && e.Status == EnrollmentStatus.Completed);

                reports.Add(new CourseCompletionReport
                {
                    CourseId = course.Id,
                    CourseTitle = course.Title,
                    TotalEnrollments = (int)totalEnrollments,
                    CompletedEnrollments = (int)completedEnrollments,
                    CompletionRate = totalEnrollments > 0 ? (double)completedEnrollments / totalEnrollments * 100 : 0
                });
            }

            return reports;
        }

        public async Task<List<DepartmentTrainingReport>> GetDepartmentTrainingReportAsync()
        {
            var users = await _users.Find(u => u.Role == UserRole.Employee && u.IsActive).ToListAsync();
            var departmentGroups = users.GroupBy(u => u.Department);
            var reports = new List<DepartmentTrainingReport>();

            foreach (var group in departmentGroups)
            {
                var userIds = group.Select(u => u.Id).ToList();
                var totalEnrollments = await _enrollments.CountDocumentsAsync(e => userIds.Contains(e.UserId));
                var completedEnrollments = await _enrollments.CountDocumentsAsync(e => userIds.Contains(e.UserId) && e.Status == EnrollmentStatus.Completed);

                reports.Add(new DepartmentTrainingReport
                {
                    Department = group.Key,
                    TotalEmployees = group.Count(),
                    TotalEnrollments = (int)totalEnrollments,
                    CompletedTrainings = (int)completedEnrollments,
                    CompletionRate = totalEnrollments > 0 ? (double)completedEnrollments / totalEnrollments * 100 : 0
                });
            }

            return reports;
        }

        public async Task<UserProgressReport> GetUserProgressReportAsync(string userId)
        {
            var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
            if (user == null) return null;

            var enrollments = await _enrollments.Find(e => e.UserId == userId).ToListAsync();
            var courseIds = enrollments.Select(e => e.CourseId).ToList();
            var courses = await _courses.Find(c => courseIds.Contains(c.Id)).ToListAsync();

            var courseProgress = enrollments.Select(e =>
            {
                var course = courses.FirstOrDefault(c => c.Id == e.CourseId);
                return new UserCourseProgress
                {
                    CourseId = e.CourseId,
                    CourseTitle = course?.Title ?? "Unknown",
                    Progress = e.Progress,
                    Status = e.Status.ToString(),
                    EnrolledAt = e.EnrolledAt,
                    CompletedAt = e.CompletedAt
                };
            }).ToList();

            return new UserProgressReport
            {
                UserId = userId,
                UserName = $"{user.FirstName} {user.LastName}",
                Department = user.Department,
                TotalCourses = enrollments.Count,
                CompletedCourses = enrollments.Count(e => e.Status == EnrollmentStatus.Completed),
                InProgressCourses = enrollments.Count(e => e.Status == EnrollmentStatus.InProgress),
                CourseProgress = courseProgress
            };
        }
    }

    // Report Models
    public class DashboardStats
    {
        public int TotalCourses { get; set; }
        public int TotalUsers { get; set; }
        public int TotalEnrollments { get; set; }
        public double CompletionRate { get; set; }
    }

    public class CourseCompletionReport
    {
        public string CourseId { get; set; }
        public string CourseTitle { get; set; }
        public int TotalEnrollments { get; set; }
        public int CompletedEnrollments { get; set; }
        public double CompletionRate { get; set; }
    }

    public class DepartmentTrainingReport
    {
        public string Department { get; set; }
        public int TotalEmployees { get; set; }
        public int TotalEnrollments { get; set; }
        public int CompletedTrainings { get; set; }
        public double CompletionRate { get; set; }
    }

    public class UserProgressReport
    {
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string Department { get; set; }
        public int TotalCourses { get; set; }
        public int CompletedCourses { get; set; }
        public int InProgressCourses { get; set; }
        public List<UserCourseProgress> CourseProgress { get; set; }
    }

    public class UserCourseProgress
    {
        public string CourseId { get; set; }
        public string CourseTitle { get; set; }
        public int Progress { get; set; }
        public string Status { get; set; }
        public DateTime EnrolledAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}