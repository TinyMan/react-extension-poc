using Microsoft.Extensions.FileProviders;
using System.IO;

var distPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "host", "src", "apps", "host", "dist"));

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    // WebRootPath = distPath
});

var app = builder.Build();

// Serve static files
app.UseStaticFiles();

// Fallback to index.html for SPA routing
app.MapFallbackToFile("index.html");

app.Run();
