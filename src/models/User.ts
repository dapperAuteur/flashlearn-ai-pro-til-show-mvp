/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, models } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    select: false, // By default, don't return password in queries
  },
  role: {
    type: String,
    enum: ['Student', 'Teacher/Parent', 'Community Leader', 'Teammate', 'Admin'],
    default: 'Student',
  },
  // We will add other fields like subscription, apiKey, etc., in later phases.
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// This Mongoose "pre-save" hook runs before a document is saved.
// We use it to automatically hash the password.
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error: any) {
    return next(error);
  }
});

// To prevent model recompilation error in Next.js hot-reloading environment
const User = models.User || mongoose.model('User', UserSchema);

export default User;