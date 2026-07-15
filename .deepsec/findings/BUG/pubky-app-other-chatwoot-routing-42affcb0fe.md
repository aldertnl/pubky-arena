# [BUG] Report conversations may use a source id from the wrong Chatwoot inbox

**File:** [`src/core/application/report/report.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/report/report.ts#L96-L102) (lines 96, 99, 102)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-chatwoot-routing`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

ReportApplication passes CHATWOOT_INBOX_IDS.REPORTS to createOrFindContact, but then calls extractSourceId(contact, email), whose implementation returns the first contact_inboxes source_id without checking that it belongs to the Reports inbox. If an existing contact was first created through Feedback or Copyright, the first source_id may belong to that other inbox, while createConversation is called with the Reports inbox id. This can fail report submission or route the report incorrectly for users who previously contacted support through another form.

## Recommendation

Make contact inbox selection inbox-aware. Ensure createOrFindContact returns or creates the contact inbox for the requested inboxId, include inbox_id in the contact_inboxes model if Chatwoot returns it, and select the matching source_id instead of the first association.

## Revalidation

**Verdict:** true-positive

ReportApplication passes `CHATWOOT_INBOX_IDS.REPORTS` into ChatwootService.createOrFindContact, but ChatwootService only uses that inbox id when creating a new contact. If contact search finds an existing contact by email, it returns that contact as-is and does not ensure the contact has a Reports inbox association. extractSourceId then validates only that `contact_inboxes` is non-empty and returns `contact.contact_inboxes[0].source_id`; its tests explicitly assert that the first source id is used when multiple inboxes exist. The TChatwootContact type stores only `source_id`, not `inbox_id`, so this code cannot select the source id matching the Reports inbox. A concrete trigger is a user who first submits feedback, creating or associating the contact with inbox 26, and later submits a report, where the existing contact's first source id may still be the feedback inbox source. The subsequent createConversation call sends that source id together with `inbox_id: 27`, which can fail or route through the wrong Chatwoot association depending on Chatwoot's API behavior. The bug is not mitigated elsewhere in the report route or service layer.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-06-15)
- V <jovanovicv90@gmail.com> (2026-05-05)
