/**
 * Client-safe member types and pure helpers.
 *
 * The full members module (`lib/members.ts`) imports `getDb` and is
 * server-only. Client components (table cells, form fields, pickers)
 * need only the row shape and the small `fullName` helper, so we
 * keep those here as a tree-shakable import target.
 */
export interface MemberRow {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  membershipNumber: string | null;
  familyGroupId: number | null;
  familyGroupName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function fullName(row: { firstName: string; middleName?: string | null; lastName: string }): string {
  return [row.firstName, row.middleName, row.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}
