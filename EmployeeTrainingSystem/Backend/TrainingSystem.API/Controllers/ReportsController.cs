// Controllers/ReportsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrainingSystem.Services;
using System.Security.Claims;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly ReportService _reportService;

        public ReportsController(ReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("dashboard-stats")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DashboardStats>> GetDashboardStats()
        {
            return await _reportService.GetDashboardStatsAsync();
        }

        [HttpGet("course-completion")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<CourseCompletionReport>>> GetCourseCompletionReport()
        {
            return await _reportService.GetCourseCompletionReportAsync();
        }

        [HttpGet("department-training")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<DepartmentTrainingReport>>> GetDepartmentTrainingReport()
        {
            return await _reportService.GetDepartmentTrainingReportAsync();
        }

        [HttpGet("user-progress/{userId}")]
        public async Task<ActionResult<UserProgressReport>> GetUserProgressReport(string userId)
        {
            // Allow users to see their own progress or admins to see any
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (userRole != "Admin" && currentUserId != userId)
                return Forbid();

            var report = await _reportService.GetUserProgressReportAsync(userId);
            if (report == null)
                return NotFound();

            return report;
        }

        [HttpGet("my-progress")]
        public async Task<ActionResult<UserProgressReport>> GetMyProgress()
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var report = await _reportService.GetUserProgressReportAsync(currentUserId);
            if (report == null)
                return NotFound();

            return report;
        }
    }
}