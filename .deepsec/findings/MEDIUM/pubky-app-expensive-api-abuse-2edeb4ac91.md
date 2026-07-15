# [MEDIUM] Unbounded public copyright form data reaches Chatwoot

**File:** [`src/core/pipes/copyright/copyright.validators.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/pipes/copyright/copyright.validators.ts#L42-L197) (lines 42, 54, 99, 107, 113, 120, 132, 139, 146, 154, 162, 169, 176, 183, 190, 197)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The traced public /api/copyright POST route delegates request JSON into these validators, but most fields are only checked for presence and trimmed. There are no server-side length caps before CopyrightApplication JSON.stringify()s the data and ChatwootService uses server-side credentials to create/find a contact and create a conversation. A direct unauthenticated caller can submit very large name, URL list, description, address, or signature fields to consume server memory/outbound bandwidth and Chatwoot quota/storage. No route-level rate limiting or abuse gate was found in the traced path.

## Recommendation

Enforce server-side max lengths for every copyright field, reject oversized request bodies before/while parsing JSON where possible, and add abuse protection such as rate limiting or CAPTCHA for the public Chatwoot-backed endpoint.

## Revalidation

**Verdict:** true-positive

The `/api/copyright` route is public, parses `request.json()` directly, and delegates the body to the copyright controller without route-level authentication, rate limiting, or body-size enforcement in the inspected code. The server-side validators mostly call `validateRequiredString`, which only checks presence and trims; there are no max lengths for names, descriptions, address fields, original-content URL text, or signature. The only format checks are basic email/phone regexes and `new URL()` for `infringingContentUrl`, none of which impose meaningful length limits. Client-side `maxLength` attributes and the client Zod schema do not mitigate direct POSTs to the API route. The application then `JSON.stringify`s the entire validated form, prefixes it, and uses server-side Chatwoot credentials to search/create a contact and create a conversation containing the unbounded content. Even if the deployment platform or Chatwoot has some absolute request-size cap, the application still accepts and processes large unauthenticated bodies up to that cap and attempts outbound API calls. A concrete attacker can repeatedly POST large but syntactically valid fields to consume server memory/CPU, outbound bandwidth, and Chatwoot contact/conversation quota.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-04-30)
- Taehwa Kim <hadeath03@gmail.com> (2026-03-12)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
