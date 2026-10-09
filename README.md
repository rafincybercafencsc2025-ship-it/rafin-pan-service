# RAFIN PAN CARD SERVICE — Website Starter

This is a starter project for a retailer-registration website with a public home page, retailer registration/login, and admin dashboard.

## Important limitations
- This starter is **not connected to Protean/NSDL** and does not create official PAN retailer IDs.
- Before offering PAN applications or issuing sub-retailer IDs, confirm written authorization and obtain the official API/sub-ID process from Protean.
- Demo accounts and sample records are not real customers.
- Do not collect Aadhaar numbers, PAN documents, OTPs, or other sensitive identity data in this starter.
- This is a development starter, not a production security audit. Have it reviewed before public deployment.

## Run locally
Requires Node.js 18+.

```bash
npm install
cp .env.example .env
# Edit .env and set a long, random SESSION_SECRET and your ADMIN_PASSWORD_HASH.
npm start
```

Open http://localhost:3000

## Set the admin password hash
Create a hash using the project's helper:
```bash
npm run hash-password -- "Use-A-Strong-Password-Here"
```
Copy the output into `.env` as `ADMIN_PASSWORD_HASH`. Then set `ADMIN_USERNAME=admin`.
For safety, change the sample session secret before running and never upload `.env` to a public repository.

## Features
- Responsive homepage and service overview
- Retailer application form
- Retailer login
- Admin dashboard for reviewing applications and approving/rejecting them
- Password hashing with bcrypt
- SQLite storage
- Session-based authentication and basic security headers

## Next steps before launch
1. Buy a domain and hosting that supports Node.js and persistent SQLite storage (or migrate to managed PostgreSQL).
2. Configure HTTPS, backups, monitoring, rate limits, email/SMS verification, CSRF protection, and privacy/terms pages.
3. Confirm the approved Protean/NSDL integration and retailer/sub-retailer authorization.
4. Have a qualified developer conduct a security and compliance review.
