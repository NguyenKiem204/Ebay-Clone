# Guest Checkout Phase 1 State Contract

## Purpose

This document locks the minimum order and payment state contract for guest checkout Phase 1.
It applies only to guest checkout within the already approved Phase 1 scope:

- Fixed-price only
- Non-auction only
- COD only
- No coupon

## State Contract at Order Creation

For a successful guest checkout Phase 1 COD order creation:

- `order.status = pending`
- `payment.status = pending`
- `payment.method = cod`

This state contract means:

- The order record has been created successfully.
- The order has been accepted by the system.
- The payment has not been completed online.
- The order is waiting for downstream fulfillment and COD collection flow.

## Meaning of Success

For guest checkout Phase 1, a successful checkout result means:

- The guest order was created successfully.
- The order has a real order number.
- The system may send a confirmation email.

It does not mean:

- Payment has been completed
- Payment has been captured
- Order is confirmed as paid

## UI and Messaging Implications

Any guest-facing success page, email, or lookup response must use wording consistent with this contract.

Allowed meaning:

- Order created
- Order placed
- Order received
- Waiting for COD fulfillment/payment collection

Disallowed meaning:

- Payment completed
- Payment confirmed
- Payment captured
- Order fully paid

## Separation From Member PayPal Flow

This guest COD state contract must not reuse member PayPal semantics.

Guest checkout Phase 1 must not inherit behavior equivalent to:

- PayPal capture completed
- Payment status moved to completed
- Order status moved to confirmed because online payment succeeded

Those semantics belong to a different flow and are out of scope for guest checkout Phase 1.

## Minimal Transition Boundary

At the moment guest checkout Phase 1 creates an order, the only locked transition is:

- No order -> `order.status = pending`
- No payment record -> `payment.status = pending`

No further post-order lifecycle transitions are defined in this commit.

## Non-Goals

This document does not define:

- Full order lifecycle after creation
- Full payment lifecycle after COD collection
- Return, dispute, or after-sales state machines
- Member checkout state machine
