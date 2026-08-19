export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN" | "RACE_ADMIN";

export interface User {
  id: string | number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;

  /**
   * Platform-level Corner League role.
   *
   * This is separate from an organization's registration role.
   *
   * Examples:
   * USER
   * RACE_ADMIN
   * ADMIN
   * SUPER_ADMIN
   */
  role?: UserRole | string;
}
