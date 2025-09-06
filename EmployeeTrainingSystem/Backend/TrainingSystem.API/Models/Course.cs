// Models/Course.cs - UPDATED VERSION
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.Models
{
    public class Course
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; } // Make nullable to avoid validation errors
        
        [Required]
        public string Title { get; set; }
        
        [Required]
        public string Description { get; set; }
        
        [Required]
        public string Category { get; set; }
        
        [Required]
        public int Duration { get; set; } // in hours
        
        [Required]
        public string Level { get; set; } // Changed from enum to string
        
        [Required]
        public string Instructor { get; set; }
        
        [Required]
        public DateTime StartDate { get; set; }
        
        [Required]
        public DateTime EndDate { get; set; }
        
        [Required]
        public int MaxParticipants { get; set; }
        
        public List<string> Prerequisites { get; set; } = new List<string>();
        public List<CourseModule> Modules { get; set; } = new List<CourseModule>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
        public string? CreatedBy { get; set; } // Make nullable to avoid validation errors
    }

    public class CourseModule
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; }
        public string Content { get; set; }
        public int Order { get; set; }
        public bool IsCompleted { get; set; }
    }
}