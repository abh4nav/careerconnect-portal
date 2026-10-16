
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticateToken(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required. Please log in.'
      });
    }

    const token = header.slice(7);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: 'Authentication is not configured.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        message: 'User account not found.'
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({
        message: 'Invalid or expired token. Please log in again.'
      });
    }

    console.error('Authentication error:', error.message);

    return res.status(500).json({
      message: 'Authentication failed.'
    });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action.'
      });
    }

    next();
  };
}
