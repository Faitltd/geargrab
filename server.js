// Explicitly use CommonJS
"use strict";

const http = require("http");

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GearGrab</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        h1 { color: #2a6b42; }
        .banner { 
          background-color: #f0f8f4; 
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .coming-soon {
          font-style: italic;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="banner">
        <h1>GearGrab</h1>
        <p>Your marketplace for outdoor equipment rentals</p>
      </div>
      <p>Welcome to GearGrab! We're building a platform to help outdoor enthusiasts rent the gear they need for their next adventure.</p>
      <p class="coming-soon">Our full platform is coming soon. Please check back later!</p>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
