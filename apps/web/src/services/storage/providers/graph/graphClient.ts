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
// / GRAPH_CLIENT_CERT_PATH are NOT in env.ts REQUIRED_SERVER, because
// the sharepoint_drive provider is inert until the resolver activates
// it (plan Task 6) and real auth is gated on the Azure app
// registration (plan Task 8). Boot-requiring these would fatally crash
// the live app before SharePoint is activated. Instead they are read
// here, at client-construction time, and a missing one throws a typed
// ServiceError — which can only fire once a caller actually reaches the
// (post-activation) provider.
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
// a caller hits the activated sharepoint_drive provider.
function readGraphConfig(): {
  tenantId: string;
  clientId: string;
  certificatePath: string;
} {
  const tenantId = env.GRAPH_TENANT_ID;
  const clientId = env.GRAPH_CLIENT_ID;
  const certificatePath = env.GRAPH_CLIENT_CERT_PATH;

  const missing: string[] = [];
  if (!tenantId) missing.push('GRAPH_TENANT_ID');
  if (!clientId) missing.push('GRAPH_CLIENT_ID');
  if (!certificatePath) missing.push('GRAPH_CLIENT_CERT_PATH');

  if (missing.length > 0) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `sharepoint_drive provider is not configured: missing ${missing.join(', ')}. ` +
        'Set the GRAPH_* env vars (Azure app registration + client certificate) ' +
        'per the SharePoint activation ops (plan Task 8).',
      { stage: 'graph_config', missing },
    );
  }

  // Narrowed to string by the missing-check above.
  return {
    tenantId: tenantId as string,
    clientId: clientId as string,
    certificatePath: certificatePath as string,
  };
}

// Return the authenticated, process-level app-only Graph client,
// building it on first use. The ClientCertificateCredential's PEM-path
// overload reads the certificate from disk at the configured path.
export function getGraphClient(): Client {
  if (cachedClient) {
    return cachedClient;
  }

  const { tenantId, clientId, certificatePath } = readGraphConfig();

  const credential = new ClientCertificateCredential(
    tenantId,
    clientId,
    certificatePath,
  );

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
