import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cookies } from 'next/headers'; // Import cookies from next/headers
import jwt from 'jsonwebtoken';
import AuthStatus from "@/components/AuthStatus"; // Import our new component
import OnlineStatusIndicator from "@/components/OnlineStatusIndicator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TIL.Show - Flashcard AI Pro",
  description: "AI-Powered Flashcards for Lifelong Learners",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check for the auth token on the server
  let isLoggedIn = false;

  try {
    const cookieStore = cookies();
  const token = (await cookieStore).get('token')?.value;
  
    if (token) {
      // Verify the token. If it's valid, the user is logged in.
      jwt.verify(token, process.env.JWT_SECRET || '');
      isLoggedIn = true;
    }
  } catch (error) {
    console.log('Token verification failed error :>> ', error);
    console.error('Token verification failed:', error);
    // If verification fails, treat as logged out
    isLoggedIn = false;
  }
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <OnlineStatusIndicator />
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-gray-800/50 backdrop-blur-sm shadow-md sticky top-0 z-10">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-white">TIL.Show</Link>
              <div className="flex items-center gap-4">
                <Link href="/pricing" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                  Upgrade
                </Link>
                <AuthStatus isLoggedIn={isLoggedIn} />
              </div>
              
            </nav>
          </header>

          {/* Main Content Area */}
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-800/50 mt-auto py-4">
            <div className="container mx-auto px-4 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} TIL.Show. All Rights Reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}