import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST() {
  // To log out, we clear the cookie by setting its maxAge to -1
  const serializedCookie = serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1, // Expire the cookie immediately
    path: '/',
  });

  return new Response(JSON.stringify({ message: 'Logged out successfully.' }), {
    status: 200,
    headers: { 'Set-Cookie': serializedCookie },
  });
}