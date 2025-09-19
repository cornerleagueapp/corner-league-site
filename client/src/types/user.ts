// src/types/user.ts
export interface User {
  id: string | number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}
