import { z } from 'zod';

// Phase 1.5B — invitation API boundary schemas.
// Convention: camelCase at the boundary; service maps to snake_case.

export const INVITATION_ROLES = ['executive', 'controller', 'ap_specialist'] as const;

export const inviteUserSchema = z
  .object({
    email: z.string().email('must be a valid email address').transform((e) => e.toLowerCase()),
    role: z.enum(INVITATION_ROLES),
  })
  .strict();

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(1, 'token is required'),
  })
  .strict();

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

export const changeRoleSchema = z
  .object({
    newRole: z.enum(INVITATION_ROLES),
  })
  .strict();

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
