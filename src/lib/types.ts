import { User } from 'better-auth';

export interface SessionUser extends User {
  username: string | null;
}
