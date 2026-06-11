// Layer-2 admit-set for the dynamic storage_provider value (ADR-0013 §2,
// Charter B real-flow D-4). Pairs with the org_settings + source_documents
// v1-active CHECKs (CHECK-broaden => Zod-broaden). This is the validation
// boundary the safety-invariant comment at the former V1_STORAGE_PROVIDER
// constant named: it must travel with the value going dynamic (D-2).
import { z } from 'zod';

export const StorageProviderAdmitSchema = z.enum([
  'supabase_storage',
  'sharepoint_drive',
]);

export type StorageProviderAdmit = z.infer<typeof StorageProviderAdmitSchema>;
