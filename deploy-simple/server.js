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
          color: #333;
          background-color: #f9f9f9;
        }
        h1 { 
          color: #2a6b42; 
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .banner { 
          background-color: #f0f8f4; 
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
        }
        .coming-soon {
          font-style: italic;
          color: #666;
          margin-top: 2rem;
          text-align: center;
          font-size: 1.2rem;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .feature {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .feature h3 {
          color: #2a6b42;
          margin-top: 0;
        }
        .cta {
          text-align: center;
          margin: 3rem 0;
        }
        .button {
          display: inline-block;
          background-color: #2a6b42;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: #1e4d30;
        }
      </style>
    </head>
    <body>
      <div class="banner">
        <h1>GearGrab</h1>
        <p>Your marketplace for outdoor equipment rentals</p>
      </div>
      
      <p>Welcome to GearGrab! We're building a platform to help outdoor enthusiasts rent the gear they need for their next adventure, without the high cost of purchasing equipment they'll only use occasionally.</p>
      
      <div class="features">
        <div class="feature">
          <h3>Find Gear Nearby</h3>
          <p>Browse camping, hiking, skiing, and other outdoor equipment available from local owners in your area.</p>
        </div>
        <div class="feature">
          <h3>Save Money</h3>
          <p>Rent high-quality gear for a fraction of the purchase price. Perfect for occasional adventurers.</p>
        </div>
        <div class="feature">
          <h3>Share Your Gear</h3>
          <p>Make money by renting out your outdoor equipment when you're not using it.</p>
        </div>
      </div>
      
      <div class="cta">
        <a href="mailto:info@geargrab.com" class="button">Get Notified When We Launch</a>
      </div>
      
      <p class="coming-soon">Our full platform is coming soon. Please check back later!</p>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
