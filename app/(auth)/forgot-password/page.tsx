"use client";
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Check your email to reset your password!');
    } catch (error) {
      console.error(error);
      setMessage('Error sending email. Try again.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-4" />
        <Button className="w-full bg-green-500 hover:bg-green-600" onClick={handleResetPassword}>Send Reset Email</Button>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}