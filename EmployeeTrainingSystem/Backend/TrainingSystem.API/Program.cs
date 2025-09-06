// Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Text;
using TrainingSystem.Models;
using TrainingSystem.Services;

var builder = WebApplication.CreateBuilder(args);

// MongoDB Configuration
builder.Services.AddSingleton<IMongoClient>(s =>
{
    var connectionString = "mongodb://rona:rona123@ac-siehiaa-shard-00-00.cg2bxxh.mongodb.net:27017,ac-siehiaa-shard-00-01.cg2bxxh.mongodb.net:27017,ac-siehiaa-shard-00-02.cg2bxxh.mongodb.net:27017/?replicaSet=atlas-nl5ze7-shard-0&ssl=true&authSource=admin";
    return new MongoClient(connectionString);
});

builder.Services.AddScoped<IMongoDatabase>(s =>
{
    var client = s.GetRequiredService<IMongoClient>();
    return client.GetDatabase("TrainingSystem");
});

// Services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<CourseService>();
builder.Services.AddScoped<EnrollmentService>();
builder.Services.AddScoped<ProgressService>();
builder.Services.AddScoped<ReportService>();

// JWT Authentication
var jwtKey = "your-very-long-secret-key-here-minimum-32-characters";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();