# Auditor Allotment Lookup (2025–26)

Private exact registration-number lookup, route: `/tools/government/auditor-allotment`.

## Secure setup

1. Create a **private Supabase project** and run `docs/auditor-allotment-schema.sql` in the SQL editor.
2. Verify the full allotment spreadsheet against the original PDF first. Prepare a CSV with column names `registration_number,society_name,auditor_name,source_page`. Strip `DR/IDR/` / similar prefixes from registration numbers only if the business rule is confirmed and preserve leading zeroes by using text. Preserve **all distinct source records for the same registration number**. Do not deduplicate by registration number. Investigate exact duplicate source rows separately; one registration number may legitimately return multiple institutions.
3. Import validated rows directly into the private database table using the Supabase dashboard. **Never commit the CSV/Excel, names table, credentials, or full PDF to GitHub or the Next.js public directory.**
4. Configure the hosting provider's server-only environment variables:
   - `AUDITOR_SUPABASE_URL`
   - `AUDITOR_SUPABASE_SERVICE_ROLE_KEY` (secret, never NEXT_PUBLIC)
5. Deploy the branch once the private database is ready. Until configured, the endpoint replies with 503 rather than exposing guesses.

Security note: Rate limiting is best-effort in-memory only and is not globally shared across serverless instances. Before a large public launch, add managed distributed IP / bot rate-limiting and log monitoring. An exact-number public lookup prevents bulk UI download but does **not** mathematically prevent determined enumeration. If stronger privacy is required, use one-time PIN/OTP or authenticated access.

Output displays all matching institutions and their auditors for the exact queried registration number; no browse/list/export API.

## Auditor contact search (requires consent before publishing)

The uploaded `emp(1).xlsx` has 23 auditor records. A private normalized CSV was prepared locally, with columns `employee_code,auditor_name,name_key,designation,mobile_number`. The CSV deliberately is **not** committed to the public repository. Verify authority/consent to disclose each person's mobile number publicly before import.

Run `docs/auditor-contact-schema.sql` in the same private Supabase project, then upload the CSV through the authenticated dashboard, not through GitHub or `public/`. The existing server-only Supabase environment settings serve both search endpoints. The site has a separate full-name contact lookup and click-to-call link. Without configured private data, search returns a service-unavailable message. Consider CAPTCHA or managed rate-limiting before public exposure, because exact-name lookups can still be enumerated.

## Verification hold for 17-11-2026(1).xlsx

The latest user-supplied workbook contains 3,264 society rows. Registration number is absent from one row and one number has slash format (1773/96). Duplicate registration numbers must be retained. All 23 auditor names occur 141-142 times each, an unusually uniform mapping; **auditor assignments must be verified against the original allotment orders before publication**. Do not deploy or import this spreadsheet as verified source of truth yet. A staging CSV exists only as a conversation artifact and is not part of this public repository.
