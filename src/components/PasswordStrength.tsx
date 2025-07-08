'use client';

import { useMemo } from 'react';

interface PasswordStrengthProps {
  password_to_check: string;
}

const Requirement = ({ label, meets }: { label: string; meets: boolean }) => (
  <li className={`flex items-center transition-colors ${meets ? 'text-green-400' : 'text-gray-400'}`}>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
      {meets ? <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path> : <circle cx="12" cy="12" r="10"></circle>}
      {meets && <polyline points="22 4 12 14.01 9 11.01"></polyline>}
    </svg>
    {label}
  </li>
);

export default function PasswordStrength({ password_to_check }: PasswordStrengthProps) {
  const requirements = useMemo(() => [
    { label: 'At least 10 characters', re: /.{10,}/ },
    { label: 'At least one uppercase letter', re: /[A-Z]/ },
    { label: 'At least one lowercase letter', re: /[a-z]/ },
    { label: 'At least one number', re: /\d/ },
    { label: 'At least one special character', re: /[@$!%*?&]/ },
  ], []);

  return (
    <ul className="mt-4 space-y-1 text-sm">
      {requirements.map((req, index) => (
        <Requirement key={index} label={req.label} meets={req.re.test(password_to_check)} />
      ))}
    </ul>
  );
}