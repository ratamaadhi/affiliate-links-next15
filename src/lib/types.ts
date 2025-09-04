import { User } from 'better-auth';

export interface SessionUser extends User {
  username: string | null;
}

export interface InPagination {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}
