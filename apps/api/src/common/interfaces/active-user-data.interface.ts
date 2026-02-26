export interface ActiveUserData {
  /** User ID (UUID) */
  userId: string;
  /** Alias for userId for compatibility */
  id: string;
  email: string;
  tenantId: string;
  role: string;
}
