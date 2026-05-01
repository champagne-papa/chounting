// src/components/canvas/UserProfileEditor.tsx
// Phase 1.2 Session 6 §6.2 — user profile form-escape surface.
// Fields per master §12.1. Pre-fills from GET /api/auth/me, saves
// via PATCH /api/auth/me. Idle/saving/saved-confirmation button.
// Inline validation errors surface per field.

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

type Profile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  phone_country_code: string | null;
  preferred_locale: string | null;
  preferred_timezone: string | null;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type ZodIssue = { path: (string | number)[]; message: string };

export function UserProfileEditor() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) ?? 'en';
  const fromWelcome = searchParams.get('from') === 'welcome';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('');
  const [preferredLocale, setPreferredLocale] = useState('');
  const [preferredTimezone, setPreferredTimezone] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ profile: Profile }>;
      })
      .then(({ profile }) => {
        if (cancelled) return;
        setFirstName(profile.first_name ?? '');
        setLastName(profile.last_name ?? '');
        setDisplayName(profile.display_name ?? '');
        setPhone(profile.phone ?? '');
        setPhoneCountryCode(profile.phone_country_code ?? '');
        setPreferredLocale(profile.preferred_locale ?? '');
        setPreferredTimezone(profile.preferred_timezone ?? '');
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState('saving');
    setSaveError(null);
    setFieldErrors({});

    const patch: Record<string, string | null> = {
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      displayName: displayName.trim() || null,
      phone: phone.trim() || null,
      phoneCountryCode: phoneCountryCode.trim() || null,
      preferredLocale: preferredLocale.trim() || null,
      preferredTimezone: preferredTimezone.trim() || null,
    };

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body?.details && Array.isArray(body.details)) {
          const errs: Record<string, string> = {};
          for (const issue of body.details as ZodIssue[]) {
            const key = String(issue.path[0] ?? '');
            if (key) errs[key] = issue.message;
          }
          setFieldErrors(errs);
          setSaveError('Please fix the highlighted fields.');
        } else {
          setSaveError(body?.message ?? body?.error ?? 'Save failed.');
        }
        setSaveState('error');
        return;
      }
      setSaveState('saved');
      if (fromWelcome) {
        // S33 Failure 3 — onboarding-mode redirect. The skip-link
        // from /welcome appends ?from=welcome; on save success here
        // we route the user back to /welcome so the state machine
        // re-evaluates (display_name now populated → step 2). 500ms
        // visible flash for "Profile updated." before the redirect.
        setTimeout(() => {
          router.push(`/${locale}/welcome`);
        }, 500);
      } else {
        setTimeout(() => {
          setSaveState((s) => (s === 'saved' ? 'idle' : s));
        }, 2000);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.');
      setSaveState('error');
    }
  }

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading profile…</div>;
  }
  if (loadError) {
    return (
      <div className="text-sm text-red-600">
        Could not load your profile: {loadError}
      </div>
    );
  }

  const buttonLabel =
    saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save changes';
  const buttonDisabled = saveState === 'saving';

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold mb-1">Your profile</h2>
      <p className="text-sm text-neutral-500 mb-6">
        The name, contact info, and preferences The Bridge uses to address you.
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <Field
          label="Display name"
          hint="What you'd like to be called in the app."
          value={displayName}
          onChange={setDisplayName}
          error={fieldErrors.displayName}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            value={firstName}
            onChange={setFirstName}
            error={fieldErrors.firstName}
          />
          <Field
            label="Last name"
            value={lastName}
            onChange={setLastName}
            error={fieldErrors.lastName}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field
            label="Country code"
            placeholder="+1"
            value={phoneCountryCode}
            onChange={setPhoneCountryCode}
            error={fieldErrors.phoneCountryCode}
          />
          <div className="col-span-2">
            <Field
              label="Phone"
              value={phone}
              onChange={setPhone}
              error={fieldErrors.phone}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Preferred locale"
            placeholder="en"
            hint="BCP-47, e.g. en or fr-CA."
            value={preferredLocale}
            onChange={setPreferredLocale}
            error={fieldErrors.preferredLocale}
          />
          <Field
            label="Preferred timezone"
            placeholder="America/Vancouver"
            hint="IANA TZ identifier."
            value={preferredTimezone}
            onChange={setPreferredTimezone}
            error={fieldErrors.preferredTimezone}
          />
        </div>

        {saveError && (
          <div className="text-sm text-red-600" role="alert">{saveError}</div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={buttonDisabled}
            className="px-4 py-2 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {buttonLabel}
          </button>
          {saveState === 'saved' && (
            <span className="text-sm text-green-700">Profile updated.</span>
          )}
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
}

function Field({ label, value, onChange, placeholder, hint, error }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-700 mb-1">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm ${
          error ? 'border-red-400' : 'border-neutral-300'
        } focus:outline-none focus:ring-1 focus:ring-neutral-400`}
      />
      {hint && !error && <span className="block text-xs text-neutral-500 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}
