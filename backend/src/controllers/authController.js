import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

const setTokenCookie = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  const isProd = process.env.COOKIE_SECURE === 'true';
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { firstName, lastName, email, password, type } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName, lastName, email: email.toLowerCase(), password: hashed, type, role: 'user'
    });

    setTokenCookie(res, user);
    res.status(201).json({
      user: { id: user._id, firstName, lastName, email: user.email, type, role: user.role }
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);              // <—— see real error in console
    res.status(500).json({ message: err.message });     // return real message
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    setTokenCookie(res, user);
    res.json({
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, type: user.type, role: user.role }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);                 // <—— see real error in console
    res.status(500).json({ message: err.message });
  }
};

export const me = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  const { _id, firstName, lastName, email, type, role } = req.user;
  res.json({ user: { id: _id, firstName, lastName, email, type, role } });
};

export const logout = (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out' });
};
