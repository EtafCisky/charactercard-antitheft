/**
 * HTTPS Redirect Middleware
 *
 * Forces HTTPS connections in production environment by redirecting
 * HTTP requests to their HTTPS equivalent.
 *
 * This middleware should be applied early in the middleware chain
 * to ensure all requests are secured before processing.
 */

/**
 * Middleware to enforce HTTPS in production environment
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void}
 */
function httpsRedirect(req, res, next) {
  // Only enforce HTTPS in production environment
  if (process.env.NODE_ENV === "production") {
    // Check if the request is already secure (HTTPS)
    // req.secure is set by Express when the connection is over HTTPS
    // Also check x-forwarded-proto header for proxy/load balancer scenarios
    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";

    if (!isSecure) {
      // Construct the HTTPS URL
      const httpsUrl = `https://${req.headers.host}${req.url}`;

      // Perform 301 (permanent) redirect to HTTPS
      return res.redirect(301, httpsUrl);
    }
  }

  // Request is already secure or not in production, continue to next middleware
  next();
}

module.exports = httpsRedirect;
