// Mock morgan for testing
export default function morgan(format) {
  return (req, res, next) => {
    // Mock morgan middleware - just log to console in test
    console.log(`${req.method} ${req.url}`);
    next();
  };
}
