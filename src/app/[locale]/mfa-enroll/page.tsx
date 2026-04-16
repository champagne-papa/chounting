'use client';

// Phase 1.5B — MFA enrollment page (functional stub).
// Guides user through TOTP enrollment via Supabase Auth MFA API.
// No polish, no recovery codes UI (Phase 2).

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams } from 'next/navigation';

export default function MfaEnrollPage() {
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleEnroll() {
    setError(null);
    const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    if (enrollErr || !data) {
      setError(enrollErr?.message ?? 'Enrollment failed');
      return;
    }
    setQrUri(data.totp.uri);
    setFactorId(data.id);
  }

  async function handleVerify() {
    if (!factorId) return;
    setError(null);

    const { data: challenge, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr || !challenge) {
      setError(challengeErr?.message ?? 'Challenge failed');
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyErr) {
      setError(verifyErr.message);
      return;
    }

    setEnrolled(true);
    window.location.href = returnTo;
  }

  if (enrolled) {
    return <div style={{ padding: '2rem' }}>MFA enrolled. Redirecting...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>MFA Enrollment Required</h1>
      <p>Your organization requires multi-factor authentication. Set up a TOTP authenticator app to continue.</p>

      {!qrUri && (
        <button onClick={handleEnroll} style={{ marginTop: '1rem' }}>
          Generate QR Code
        </button>
      )}

      {qrUri && (
        <div style={{ marginTop: '1rem' }}>
          <p>Scan this QR code with your authenticator app:</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
            alt="TOTP QR code"
            width={200}
            height={200}
          />
          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              style={{ marginRight: '0.5rem' }}
            />
            <button onClick={handleVerify}>Verify</button>
          </div>
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}
