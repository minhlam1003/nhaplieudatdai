# Security Specification - Land Records Management

## Data Invariants
1.   A record must have a unique `maHoSoLuuTru` (enforced by application logic/document ID).
2.   Only the Admin (`lamxtrai2k1@gmail.com`) can promote users to `employee` or `admin`.
3.   A `pending` user has no access to `records`.
4.   An `employee` can only read and write `records` that have been explicitly assigned to them via the `assignedUid` field.
5.   Admin has full read/write access to all `users` and `records`.

## The "Dirty Dozen" Payloads (Targeting Exploits)

1.  **Identity Theft**: User tries to create a record with `assignedUid` of another user. (Blocked by `isValidRecord` checking `assignedUid`)
2.  **Privilege Escalation**: User tries to update their own `role` to `admin`. (Blocked by `affectedKeys().hasOnly()` in user update)
3.  **Shadow Field Injection**: User tries to add `isSuperAdmin: true` to their profile. (Blocked by strict field validation)
4.  **Assigned Data Leak**: Employee tries to query all records without filtering by `assignedUid`. (Blocked by `allow list` enforcer)
5.  **Orphaned Record**: User tries to create a record without a valid `maHoSoLuuTru`. (Blocked by size/type validation)
6.  **Admin Bypass**: Non-admin tries to read `/users/` collection. (Blocked by `isAdmin` check)
7.  **Resource Poisoning**: User tries to set a 2MB string into `hoTenChuSuDung`. (Blocked by `.size()` constraint)
8.  **ID Poisoning**: User tries to use a 200 character string as record ID. (Blocked by `isValidId`)
9.  **Terminal State Locking**: User tries to change `maHoSoLuuTru` after creation. (Blocked by immutability check)
10. **Auth Spoofing**: User tries to write data without email verification. (Blocked by `request.auth.token.email_verified`)
11. **Cross-User Assignee Swap**: Employee tries to reassign their record to someone else. (Blocked by `affectedKeys()`)
12. **Metadata Tampering**: User tries to set `createdAt` back in time. (Blocked by `request.time` server timestamp)

## Red Team Conflict Report

| Vulnerability | Mitigation Logic | Status |
| :--- | :--- | :--- |
| Identity Spoofing | `incoming().assignedUid == request.auth.uid || isAdmin()` | PREVENTED |
| Privilege Escalation | `!incoming().diff(existing()).affectedKeys().hasAny(['role', 'status'])` for users | PREVENTED |
| Resource Poisoning | Strict `.size()` checks on all incoming string fields | PREVENTED |
| Data Scraping | `allow list: if resource.data.assignedUid == request.auth.uid || isAdmin()` | PREVENTED |

