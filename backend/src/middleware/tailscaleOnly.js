// Middleware to restrict access to Tailscale network and home IP only
export function tailscaleOnly(req, res, next) {
  // Get the real IP address (considering proxy)
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Remove IPv6 prefix if present
  const ip = clientIp.replace(/^::ffff:/, '');
  
  // Allow localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return next();
  }
  
  // Allow your home IP
  if (ip === '147.93.3.63') {
    console.log(`Allowing home IP: ${ip}`);
    return next();
  }
  
  // Allow Tailscale IP range (100.64.0.0/10)
  // This includes 100.64.0.0 - 100.127.255.255
  const ipParts = ip.split('.');
  if (ipParts.length === 4) {
    const firstOctet = parseInt(ipParts[0]);
    const secondOctet = parseInt(ipParts[1]);
    
    // Check if it's in Tailscale range
    if (firstOctet === 100 && secondOctet >= 64 && secondOctet <= 127) {
      console.log(`Allowing Tailscale IP: ${ip}`);
      return next();
    }
  }
  
  // Reject all other IPs
  console.log(`Blocked unauthorized IP: ${ip}`);
  res.status(403).json({ 
    error: 'Access denied. This service is only available via Tailscale VPN or authorized IPs.',
    yourIp: ip 
  });
}

export default tailscaleOnly;