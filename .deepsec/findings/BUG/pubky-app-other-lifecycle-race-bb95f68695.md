# [BUG] Invoice creation can outlive component cleanup

**File:** [`src/components/organisms/HumanLightningPayment/HumanLightningPayment.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/HumanLightningPayment/HumanLightningPayment.tsx#L67-L95) (lines 67, 68, 69, 70, 90, 95)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-lifecycle-race`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

requestLightningInvoice awaits VerificationHandler.create() before storing the returned handler in verificationRef. If the component unmounts or the user navigates back while that await is still pending, the cleanup only sees verificationRef.current as null and cannot abort the pending setup. When the promise later resolves, the handler has already started polling/listeners internally and lines 68-70 then update refs/state for an unmounted component. This can leave orphan Lightning verification polling, a visibilitychange listener, and stale callbacks/toasts until the invoice expires or the request finishes.

## Recommendation

Track a cancelled/mounted flag or pass an AbortSignal through VerificationHandler.create(). After create resolves, immediately abort and skip state updates if the component has unmounted or the request has been superseded. Ideally make VerificationHandler creation cancellable before it starts polling/listeners.

## Revalidation

**Verdict:** true-positive

The target component awaits VerificationHandler.create() before assigning verificationRef.current, and the unmount cleanup can only abort a handler that is already in that ref. VerificationHandler.create() first awaits HomegateController.createLnVerification(), and the underlying HomegateService.createLnVerification() POST does not accept or pass an AbortSignal. Only after that await completes does create() construct the handler, start payment polling, start the expiry timer, and add the visibilitychange listener. A concrete trigger is mounting the Lightning payment step, letting the setTimeout fire, and navigating back or unmounting while the invoice creation request is still pending. The cleanup then sees verificationRef.current as null, so it cannot abort anything. When the request later resolves, the stale async continuation stores the handler in the old ref and calls setVerification, setIsPaymentExpired, and setIsLoading on an unmounted component. Because no later cleanup will run for that handler, its long-poll, expiry timer, visibility listener, and callbacks can continue until payment confirmation, failure, or expiry. This is not an auth or data-exfiltration issue, but it is a real lifecycle/resource leak bug in the current HEAD.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-06-15)
- V <jovanovicv90@gmail.com> (2026-05-05)
