# Guest Checkout Phase 1 Spec

## Purpose

This document locks the business scope and data semantics for guest checkout Phase 1.
It is the source of truth for Phase 0 Commit 0.1 only.

## Phase 1 Scope

Guest checkout Phase 1 is limited to the following rules:

- Fixed-price only
- Non-auction only
- COD only
- No coupon

## Eligibility Source of Truth

- Backend is the source of truth for guest checkout eligibility.
- Frontend must not decide guest eligibility by UI state, item count, or local assumptions.
- Frontend may only call backend eligibility APIs and render the result.

## Required Guest Order Input

The minimum required guest order input for Phase 1 is:

- `guestFullName`
- `guestEmail`
- `guestPhone`
- `shippingAddress`

`shippingAddress` must contain the full shipping destination required to create a real order.

## Field Semantics

### Customer Type

- `CustomerType` has exactly 2 allowed values:
- `member`
- `guest`
- `CustomerType` is the explicit customer classification field.
- Guest vs member must not be inferred only from `buyer_id` being null or non-null.

### Guest Contact Snapshot

- `GuestFullName`
- `GuestEmail`
- `GuestPhone`

These fields represent the purchaser/contact snapshot captured at checkout time.

They are used for:

- Checkout contact identity
- Guest confirmation email
- Minimal guest order lookup flow

They are not the canonical shipping source of truth.

### Canonical Shipping Snapshot

- `ShipFullName`
- `ShipPhone`
- `ShipStreet`
- `ShipCity`
- `ShipState`
- `ShipPostalCode`
- `ShipCountry`

These fields represent the canonical shipping snapshot stored on the order at purchase time.

They are used for:

- Post-order shipping display
- Order detail rendering
- Fulfillment/shipping recipient data

These fields are the canonical shipping source of truth after order creation.

### Seller Snapshot

- `SellerDisplayNameSnapshot`

This field stores the buyer-facing seller label shown at purchase time.

It is not a generic seller identity field.
It is specifically the display name visible to the buyer when the order was placed.

## Address Reference Rule

- `orders.address_id` is only an optional reference.
- `orders.address_id` is not the shipping source of truth.
- Shipping must be rendered from the immutable shipping snapshot on the order.

## Out of Scope for Phase 1

The following are explicitly out of scope for guest checkout Phase 1:

- Auction guest checkout
- PayPal guest checkout
- Guest coupon support
- Post-order token hardening beyond the minimal guest lookup plan

## Non-Goals

Guest checkout Phase 1 is not intended to deliver a full marketplace-grade post-order security model.
Its goal is to enable a real guest order flow with clear scope and explicit data semantics.
