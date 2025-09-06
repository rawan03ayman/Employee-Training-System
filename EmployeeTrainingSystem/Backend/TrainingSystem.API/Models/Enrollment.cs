// Models/Enrollment.cs - FIXED VERSION WITH PROPER NAMESPACE
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.Models
{
    public class Enrollment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        
        [Required]
        public string UserId { get; set; }
        
        [Required]
        public string CourseId { get; set; }
        
        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
        public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Enrolled;
        public int Progress { get; set; } = 0; // 0-100
        public DateTime? CompletedAt { get; set; }
        public int? FinalScore { get; set; }
        public List<AttendanceRecord> Attendance { get; set; } = new List<AttendanceRecord>();
        public string? AssignedBy { get; set; }
    }

    public class AttendanceRecord
    {
        public DateTime Date { get; set; }
        public bool Present { get; set; }
        public string? Notes { get; set; }
    }

    public enum EnrollmentStatus
    {
        Enrolled,
        InProgress,
        Completed,
        Dropped
    }
}