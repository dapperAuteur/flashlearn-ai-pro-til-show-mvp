import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface UserPayload {
  userId: string;
  role: string;
}

export const verifyAuth = (request: NextRequest): UserPayload => {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    throw new Error('Authorization token not found.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as UserPayload;
    return decoded;
  } catch (error) {
    console.log('Auth Middlware error :>> ', error);
    throw new Error('Invalid or expired token.');
  }
};