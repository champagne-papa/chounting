// src/components/canvas/OrgProfileEditor.tsx
// Phase 1.2 Session 6 §6.3 — org profile form-escape surface.
// Fields per master §12.2 (camelCase names from
// updateOrgProfilePatchSchema per Phase 1.5A convention).
// baseCurrency + fiscalYearStartMonth are NOT editable — rendered
// as readonly so the user can see them but the schema .strict()
// rejects attempts to patch them. industryId is a dropdown populated
// from GET /api/industries.

'use client';

import { useEffect, useState } from 'react';
import {
  BUSINESS_STRUCTURES,
  ACCOUNTING_FRAMEWORKS,
  REPORT_BASES,
} from '@/shared/schemas/organization/profile.schema';

interface Props {
  orgId: string;
}

type Industry = {
  industry_id: string;
  slug: string;
  display_name: string;
};

type OrgRow = {
  org_id: string;
  name: string;
  legal_name: string | null;
  industry_id: string | null;
  business_structure: string | null;
  business_registration_number: string | null;
  tax_registration_number: string | null;
  accounting_framework: string | null;
  email: string | null;
  phone: string | null;
  phone_country_code: string | null;
  time_zone: string | null;
  default_locale: string | null;
  default_report_basis: string | null;
  functional_currency: string | null;
  fiscal_year_start_month: number | null;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type ZodIssue = { path: (string | number)[]; message: string };

export function OrgProfileEditor({ orgId }: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [industries, setIndustries] = useState<Industry[]>([]);

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [businessStructure, setBusinessStructure] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState('');
  const [accountingFramework, setAccountingFramework] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [defaultLocale, setDefaultLocale] = useState('');
  const [defaultReportBasis, setDefaultReportBasis] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('');
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/orgs/${orgId}/profile`).then(async (res) => {
        if (!res.ok) throw new Error(`Profile load: HTTP ${res.status}`);
        return res.json() as Promise<{ organization: OrgRow }>;
      }),
      fetch('/api/industries').then(async (res) => {
        if (!res.ok) throw new Error(`Industries load: HTTP ${res.status}`);
        return res.json() as Promise<{ industries: Industry[] }>;
      }),
    ])
      .then(([{ organization }, { industries: inds }]) => {
        if (cancelled) return;
        setIndustries(inds);
        setName(organization.name ?? '');
        setLegalName(organization.legal_name ?? '');
        setIndustryId(organization.industry_id ?? '');
        setBusinessStructure(organization.business_structure ?? '');
        setBusinessRegistrationNumber(organization.business_registration_number ?? '');
        setTaxRegistrationNumber(organization.tax_registration_number ?? '');
        setAccountingFramework(organization.accounting_framework ?? '');
        setEmail(organization.email ?? '');
        setPhone(organization.phone ?? '');
        setPhoneCountryCode(organization.phone_country_code ?? '');
        setTimeZone(organization.time_zone ?? '');
        setDefaultLocale(organization.default_locale ?? '');
        setDefaultReportBasis(organization.default_report_basis ?? '');
        setBaseCurrency(organization.functional_currency ?? '');
        setFiscalYearStartMonth(organization.fiscal_year_start_month);
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
  }, [orgId]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState('saving');
    setSaveError(null);
    setFieldErrors({});

    const patch: Record<string, unknown> = {
      name: name.trim(),
      legalName: legalName.trim() || null,
      industryId,
      businessStructure,
      businessRegistrationNumber: businessRegistrationNumber.trim() || null,
      taxRegistrationNumber: taxRegistrationNumber.trim() || null,
      accountingFramework,
      email: email.trim() || null,
      phone: phone.trim() || null,
      phoneCountryCode: phoneCountryCode.trim() || null,
      timeZone: timeZone.trim(),
      defaultLocale: defaultLocale.trim(),
      defaultReportBasis,
    };

    try {
      const res = await fetch(`/api/orgs/${orgId}/profile`, {
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
        } else if (body?.error === 'ORG_IMMUTABLE_FIELD') {
          setSaveError(
            'Base currency and fiscal year start are fixed at org creation and cannot be changed here.',
          );
        } else if (body?.error === 'INDUSTRY_NOT_FOUND') {
          setSaveError('The selected industry could not be found. Pick another.');
        } else {
          setSaveError(body?.message ?? body?.error ?? 'Save failed.');
        }
        setSaveState('error');
        return;
      }
      setSaveState('saved');
      setTimeout(() => {
        setSaveState((s) => (s === 'saved' ? 'idle' : s));
      }, 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.');
      setSaveState('error');
    }
  }

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading organization…</div>;
  }
  if (loadError) {
    return (
      <div className="text-sm text-red-600">
        Could not load this organization: {loadError}
      </div>
    );
  }

  const buttonLabel =
    saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save changes';
  const buttonDisabled = saveState === 'saving';

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-1">Organization profile</h2>
      <p className="text-sm text-neutral-500 mb-6">
        Settings for this organization. Only controllers can change these values.
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <TextField
          label="Organization name"
          value={name}
          onChange={setName}
          error={fieldErrors.name}
        />
        <TextField
          label="Legal name"
          hint="The full legal entity name, if different from the display name."
          value={legalName}
          onChange={setLegalName}
          error={fieldErrors.legalName}
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Industry"
            value={industryId}
            onChange={setIndustryId}
            options={industries.map((i) => ({ value: i.industry_id, label: i.display_name }))}
            error={fieldErrors.industryId}
          />
          <SelectField
            label="Business structure"
            value={businessStructure}
            onChange={setBusinessStructure}
            options={BUSINESS_STRUCTURES.map((v) => ({ value: v, label: formatEnum(v) }))}
            error={fieldErrors.businessStructure}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Business registration #"
            value={businessRegistrationNumber}
            onChange={setBusinessRegistrationNumber}
            error={fieldErrors.businessRegistrationNumber}
          />
          <TextField
            label="Tax registration #"
            value={taxRegistrationNumber}
            onChange={setTaxRegistrationNumber}
            error={fieldErrors.taxRegistrationNumber}
          />
        </div>

        <SelectField
          label="Accounting framework"
          value={accountingFramework}
          onChange={setAccountingFramework}
          options={ACCOUNTING_FRAMEWORKS.map((v) => ({ value: v, label: frameworkLabel(v) }))}
          error={fieldErrors.accountingFramework}
        />

        <TextField
          label="Contact email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />

        <div className="grid grid-cols-3 gap-3">
          <TextField
            label="Country code"
            placeholder="+1"
            value={phoneCountryCode}
            onChange={setPhoneCountryCode}
            error={fieldErrors.phoneCountryCode}
          />
          <div className="col-span-2">
            <TextField
              label="Phone"
              value={phone}
              onChange={setPhone}
              error={fieldErrors.phone}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Time zone"
            placeholder="America/Vancouver"
            hint="IANA TZ identifier."
            value={timeZone}
            onChange={setTimeZone}
            error={fieldErrors.timeZone}
          />
          <TextField
            label="Default locale"
            placeholder="en"
            hint="BCP-47 tag, e.g. en or fr-CA."
            value={defaultLocale}
            onChange={setDefaultLocale}
            error={fieldErrors.defaultLocale}
          />
        </div>

        <SelectField
          label="Default report basis"
          value={defaultReportBasis}
          onChange={setDefaultReportBasis}
          options={REPORT_BASES.map((v) => ({ value: v, label: formatEnum(v) }))}
          error={fieldErrors.defaultReportBasis}
        />

        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm">
          <div className="font-medium text-neutral-700 mb-1">Set at creation (not editable)</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-neutral-500">Base currency</span>
              <div className="font-mono text-neutral-800">{baseCurrency || '—'}</div>
            </div>
            <div>
              <span className="text-xs text-neutral-500">Fiscal year starts</span>
              <div className="text-neutral-800">
                {fiscalYearStartMonth ? monthName(fiscalYearStartMonth) : '—'}
              </div>
            </div>
          </div>
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
            <span className="text-sm text-green-700">Organization updated.</span>
          )}
        </div>
      </form>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
}
function TextField({ label, value, onChange, placeholder, hint, error }: TextFieldProps) {
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

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}
function SelectField({ label, value, onChange, options, error }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-700 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm bg-white ${
          error ? 'border-red-400' : 'border-neutral-300'
        } focus:outline-none focus:ring-1 focus:ring-neutral-400`}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}

function formatEnum(v: string): string {
  return v
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function frameworkLabel(v: string): string {
  switch (v) {
    case 'aspe':
      return 'ASPE';
    case 'ifrs':
      return 'IFRS';
    case 'us_gaap':
      return 'US GAAP';
    default:
      return formatEnum(v);
  }
}

function monthName(month: number): string {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return names[month - 1] ?? String(month);
}
