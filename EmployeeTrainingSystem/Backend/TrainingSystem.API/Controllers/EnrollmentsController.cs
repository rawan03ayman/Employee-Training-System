// Controllers/EnrollmentsController.cs - COMPLETE FIXED VERSION
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrainingSystem.Models;
using TrainingSystem.Services;
using System.Security.Claims;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EnrollmentsController : ControllerBase
    {
        private readonly EnrollmentService _enrollmentService;
        private readonly CourseService _courseService;
        private readonly UserService _userService;

        public EnrollmentsController(
            EnrollmentService enrollmentService,
            CourseService courseService,
            UserService userService)
        {
            _enrollmentService = enrollmentService;
            _courseService = courseService;
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<Enrollment>>> GetEnrollments()
        {
            try
            {
                return await _enrollmentService.GetAllEnrollmentsAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving enrollments: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Enrollment>> GetEnrollment(string id)
        {
            try
            {
                var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(id);
                if (enrollment == null)
                    return NotFound();

                return enrollment;
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving enrollment: {ex.Message}");
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<Enrollment>>> GetUserEnrollments(string userId)
        {
            try
            {
                // Allow users to see their own enrollments or admins to see any
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userRole != "Admin" && currentUserId != userId)
                    return Forbid();

                return await _enrollmentService.GetEnrollmentsByUserIdAsync(userId);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving user enrollments: {ex.Message}");
            }
        }

        [HttpGet("course/{courseId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<Enrollment>>> GetCourseEnrollments(string courseId)
        {
            try
            {
                return await _enrollmentService.GetEnrollmentsByCourseIdAsync(courseId);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving course enrollments: {ex.Message}");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Enrollment>> CreateEnrollment(CreateEnrollmentRequest request)
        {
            try
            {
                // Check if enrollment already exists
                if (await _enrollmentService.EnrollmentExistsAsync(request.UserId, request.CourseId))
                    return BadRequest("User is already enrolled in this course");

                // Verify course and user exist
                var course = await _courseService.GetCourseByIdAsync(request.CourseId);
                var user = await _userService.GetUserByIdAsync(request.UserId);

                if (course == null)
                    return BadRequest("Course not found");
                
                if (user == null)
                    return BadRequest("User not found");

                var enrollment = new Enrollment
                {
                    UserId = request.UserId,
                    CourseId = request.CourseId,
                    AssignedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.Identity.Name,
                    EnrolledAt = DateTime.UtcNow,
                    Status = EnrollmentStatus.Enrolled,
                    Progress = 0
                };

                var createdEnrollment = await _enrollmentService.CreateEnrollmentAsync(enrollment);
                return CreatedAtAction(nameof(GetEnrollment), new { id = createdEnrollment.Id }, createdEnrollment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error creating enrollment: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateEnrollment(string id, Enrollment enrollment)
        {
            try
            {
                var success = await _enrollmentService.UpdateEnrollmentAsync(id, enrollment);
                if (!success)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating enrollment: {ex.Message}");
            }
        }

        [HttpPut("{id}/progress")]
        public async Task<IActionResult> UpdateProgress(string id, UpdateProgressRequest request)
        {
            try
            {
                var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(id);
                if (enrollment == null)
                    return NotFound();

                // Allow users to update their own progress or admins to update any
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userRole != "Admin" && currentUserId != enrollment.UserId)
                    return Forbid();

                var success = await _enrollmentService.UpdateProgressAsync(id, request.Progress);
                if (!success)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating progress: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteEnrollment(string id)
        {
            try
            {
                var success = await _enrollmentService.DeleteEnrollmentAsync(id);
                if (!success)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error deleting enrollment: {ex.Message}");
            }
        }
    }

    public class CreateEnrollmentRequest
    {
        public string UserId { get; set; }
        public string CourseId { get; set; }
    }

    public class UpdateProgressRequest
    {
        public int Progress { get; set; }
    }
}