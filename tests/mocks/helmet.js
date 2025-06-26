// Mock helmet for testing
export default function helmet() {
  return (req, res, next) => {
    // Mock helmet middleware
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  };
}
