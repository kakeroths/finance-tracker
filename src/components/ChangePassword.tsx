// src/components/ChangePassword.tsx
'use client';
import React, { useState } from 'react';
import API from '@/lib/api';
import { getErrorMessage } from '@/lib/error';

export default function ChangePassword() {
  const [step, setStep] = useState<'idle'|'requested'|'done'>('idle');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    setLoading(true);
    try {
      await API.post('/user/change-request');
      setStep('requested');
      alert('OTP sent to your email');
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally { setLoading(false); }
  };

  const verify = async () => {
    setLoading(true);
    try {
      await API.post('/user/change-verify', { code: otp, newPassword });
      setStep('done');
      alert('Password changed. Please login again.');
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally { setLoading(false); }
  };

  if (step === 'done') return <div className="mt-3 text-green-600">Password updated successfully.</div>;

  return (
    <div className="mt-4">
      {step === 'idle' && (
        <button onClick={requestOtp} disabled={loading} className="px-3 py-1 bg-yellow-600 text-white rounded">Change Password</button>
      )}

      {step === 'requested' && (
        <div className="space-y-2 mt-3">
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP" className="p-2 border rounded w-full" />
          <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" type="password" className="p-2 border rounded w-full" />
          <div className="flex gap-2">
            <button onClick={verify} disabled={loading} className="px-3 py-1 bg-green-600 text-white rounded">Verify & Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
