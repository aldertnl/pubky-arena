# [BUG] Chatwoot source ID is selected from the first inbox, not the requested inbox

**File:** [`src/core/services/chatwoot/chatwoot.utils.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/chatwoot/chatwoot.utils.ts#L32-L40) (lines 32, 33, 40)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-logic-bug`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

extractSourceId only checks that contact_inboxes is non-empty and then returns contact_inboxes[0].source_id. ChatwootService.createOrFindContact returns an existing contact by email, while callers then create conversations for different inbox IDs. A contact that first used one support form and later another can therefore reuse a source_id from the wrong inbox, causing conversation creation to fail or route to the wrong Chatwoot inbox depending on Chatwoot API behavior.

## Recommendation

Include the target inbox ID in the contact inbox data, pass the requested inboxId into source-id selection, and select the matching contact_inbox. If no matching association exists, create or attach the contact for that inbox before creating the conversation.

## Revalidation

**Verdict:** true-positive

`extractSourceId` only checks that `contact.contact_inboxes` is non-empty and returns `contact.contact_inboxes[0].source_id`. `ChatwootService.createOrFindContact` returns an existing contact based solely on email equality and does not ensure that the returned contact is associated with the inbox requested by the caller. The feedback, report, and copyright applications then pass different fixed inbox IDs into `createConversation` while using whichever first `source_id` was returned. The local type for `contact_inboxes` only models `source_id`, and the helper does not accept the target inbox ID, so there is no way in current code to choose the matching association. The tests explicitly encode the current behavior: multiple inboxes return the first source ID. A concrete failure path is a user/pubky that first creates a feedback contact and later submits a report; the report flow can reuse the feedback inbox source ID with the reports inbox ID. Depending on Chatwoot validation this can either fail conversation creation or associate the conversation with the wrong inbox/source.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
