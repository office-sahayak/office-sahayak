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
