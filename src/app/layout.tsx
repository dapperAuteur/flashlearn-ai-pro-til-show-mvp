import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TIL.Show - Flashcard AI Pro",
  description: "AI-Powered Flashcards for Lifelong Learners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-gray-800/50 backdrop-blur-sm shadow-md sticky top-0 z-10">
            <nav className="container mx-auto px-4 py-3">
              <h1 className="text-xl font-bold text-white">TIL.Show</h1>
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