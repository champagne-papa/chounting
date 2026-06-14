// src/services/storage/providers/graph/graphClient.ts
//
// App-only Microsoft Graph client factory for the sharepoint_drive
// storage provider (Charter B (a), spec D-B2).
//
// Auth model (spec D-B2): app-only client-credentials via a client
// CERTIFICATE (not a secret), scoped at the app registration to
// Sites.Selected ONLY. No signed-in user; no user refresh tokens.
// @azure/identity's ClientCertificateCredential caches access tokens
// internally and refreshes them on expiry, so this module holds a
// single process-level Client and lets the credential manage tokens.
//
// Configuration is OPTIONAL at boot: GRAPH_TENANT_ID / GRAPH_CLIENT_ID
// / GRAPH_CLIENT_CERT_PEM are NOT in env.ts REQUIRED_SERVER, because
// real SharePoint auth is gated on the (still-pending) Azure app
// registration + per-site grant. The provider is wired and active
// (services/storage/resolver.ts) and the org_settings columns are defined
// (migration 20240179) — only the Azure side + per-org value population
// remain. Boot-requiring these would fatally crash the live app before
// SharePoint is configured. Instead they are read here, at
// client-construction time, and a missing one throws a typed ServiceError
// — which can only fire once a caller actually reaches the provider.
//
// Per ADR-0020 authority gradient: Layer 2 (services) data-access
// infrastructure. Allowed imports: shared, services (same-layer), db.
// NOT wrapped in withInvariants (ADR-0013 §1; storage is data-access).

import { ClientCertificateCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { env } from '@/shared/env';
import { ServiceError } from '@/services/errors/ServiceError';

// App-only client-credentials uses the ".default" scope: the app's
// admin-consented application permissions (Sites.Selected) apply; no
// per-request scope narrowing.
const GRAPH_DEFAULT_SCOPE = 'https://graph.microsoft.com/.default';

// Process-level singleton. app-only auth carries no per-user state, so
// one authenticated Client serves every org; the credential refreshes
// tokens internally. Lazily built on first use (post-activation).
let cachedClient: Client | null = null;

// Read + validate Graph config at construction time. Throws a typed
// ServiceError if any of the three vars is absent — only reachable once
// a caller hits the activated sharepoint_drive provider. Exported as the
// test seam (the missing / valid / malformed cases are unit-tested).
export function readGraphConfig(): {
  tenantId: string;
  clientId: string;
  certificatePem: string;
} {
  const tenantId = env.GRAPH_TENANT_ID;
  const clientId = env.GRAPH_CLIENT_ID;
  const certificatePemB64 = env.GRAPH_CLIENT_CERT_PEM;

  const missing: string[] = [];
  if (!tenantId) missing.push('GRAPH_TENANT_ID');
  if (!clientId) missing.push('GRAPH_CLIENT_ID');
  if (!certificatePemB64) missing.push('GRAPH_CLIENT_CERT_PEM');

  if (missing.length > 0) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `sharepoint_drive provider is not configured: missing ${missing.join(', ')}. ` +
        'Set the GRAPH_* env vars (Azure app registration + base64-encoded client ' +
        'certificate PEM) per the SharePoint activation ops.',
      { stage: 'graph_config', missing },
    );
  }

  // base64-decode the PEM. Buffer.from(.., 'base64') is LENIENT — Node drops
  // non-base64 characters rather than throwing — so a fat-fingered value would
  // otherwise surface as a cryptic failure at getToken time. Validate the
  // decoded value is PEM-shaped and throw a clear typed error instead. This is
  // a config-sanity check (catches forgot-to-base64 / truncated paste / wrong
  // var); it does NOT prove the key authenticates — that is the live Graph
  // discharge.
  const certificatePem = Buffer.from(
    certificatePemB64 as string,
    'base64',
  ).toString('utf8');

  if (
    !certificatePem.includes('-----BEGIN') ||
    !certificatePem.includes('-----END')
  ) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      'GRAPH_CLIENT_CERT_PEM is not a valid base64-encoded PEM certificate ' +
        '(the decoded value is not PEM-shaped). Provide the base64 of a PEM file ' +
        'containing both the public and private keys.',
      { stage: 'graph_config' },
    );
  }

  // Narrowed to string by the missing-check above.
  return {
    tenantId: tenantId as string,
    clientId: clientId as string,
    certificatePem,
  };
}

// Return the authenticated, process-level app-only Graph client,
// building it on first use. Uses @azure/identity's in-memory PEM overload
// (ClientCertificatePEMCertificate { certificate }) — the certificate
// contents are passed directly, with no disk read — the serverless-correct
// pattern for Vercel's read-only filesystem.
export function getGraphClient(): Client {
  if (cachedClient) {
    return cachedClient;
  }

  const { tenantId, clientId, certificatePem } = readGraphConfig();

  const credential = new ClientCertificateCredential(tenantId, clientId, {
    certificate: certificatePem,
  });

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: [GRAPH_DEFAULT_SCOPE],
  });

  cachedClient = Client.initWithMiddleware({ authProvider });
  return cachedClient;
}

// Test seam: reset the process-level singleton (unit tests inject a
// mocked Client by mocking this module's getGraphClient, but the reset
// keeps a real-path test from leaking a cached instance across cases).
export function __resetGraphClientForTest(): void {
  cachedClient = null;
}
