/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// This regular expression enforces the password requirements
const PASSWORD_VALIDATION_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;



export async function POST(request: Request) {
  // 1. Connect to the database
  await dbConnect();

  try {
    // 2. Parse the request body to get email and password
    const { email, password } = await request.json();

    // 3. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (!PASSWORD_VALIDATION_REGEX.test(password)) {
      return NextResponse.json(
        {
          message:
            'Password does not meet requirements. It must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character.',
        },
        { status: 400 }
      );
    }
    
    // 4. Check if a user with the given email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists.' },
        { status: 409 } // 409 Conflict
      );
    }

    // 5. Create a new user instance
    // The password will be hashed automatically by the pre-save hook in our User model
    const newUser = new User({
      email,
      password,
      // Role defaults to 'Student' as defined in the schema
    });

    // 6. Save the new user to the database
    await newUser.save();
    
    // 7. Return a success response (omitting the password)
    return NextResponse.json(
      {
        message: 'User created successfully.',
        user: {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 } // 201 Created
    );
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration.', error: error.message },
      { status: 500 }
    );
  }
}