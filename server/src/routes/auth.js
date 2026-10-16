
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Create a new student account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required.'
      });
    }

    if (name.trim().length > 100 || email.trim().length > 254) {
      return res.status(400).json({
        message: 'Name or email is too long.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Public registration always creates a student.
    // Never accept a role from the request body.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'student'
    });

    return res.status(201).json({
      message: 'Account created successfully. Please log in.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    console.error('Registration error:', error.message);
    return res.status(500).json({
      message: 'Unable to create account right now.'
    });
  }
});

// Log in an existing user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing from server environment.');
      return res.status(500).json({
        message: 'Authentication is not configured.'
      });
    }

    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      message: 'Unable to log in right now.'
    });
  }
});

export default router;
