# Guest Checkout Phase 1 Migration Rollout

## Purpose

This document locks the rollout and verification process for Phase 1 schema alignment.

Its purpose is to ensure:

- existing databases migrated by EF reach the same schema target as fresh databases bootstrapped from init SQL
- Phase 1 schema changes are verified before any Phase 2 API work begins
- compatibility behavior is explicit and not mistaken for the canonical source of truth

## Scope of Phase 1 Schema Alignment

Phase 1 schema alignment includes the following changes:

- `orders.buyer_id` becomes nullable
- `orders.address_id` becomes nullable
- `orders.customer_type` is added
- guest purchaser/contact fields are added on `orders`
- canonical shipping snapshot fields are added on `orders`
- immutable item snapshot fields are added on `order_items`
- `payments.user_id` becomes nullable
- DB-generated `order_number` behavior is removed/disabled

### Orders changes

- `buyer_id`
- `address_id`
- `customer_type`
- `guest_full_name`
- `guest_email`
- `guest_phone`
- `ship_full_name`
- `ship_phone`
- `ship_street`
- `ship_city`
- `ship_state`
- `ship_postal_code`
- `ship_country`

### Order item snapshot changes

- `product_title_snapshot`
- `product_image_snapshot`
- `seller_display_name_snapshot`

### Payments changes

- `user_id`

## Compatibility / Fallback Rule

Phase 1 introduces snapshot-based storage for order shipping data and order item display data.

The compatibility rule is:

- new order rows: snapshot fields are canonical
- new order item rows: snapshot fields are canonical
- rows without snapshot data may fallback to legacy relations only for compatibility

This fallback rule exists only to keep legacy data readable.

Fallback is not the canonical source of truth.

That means:

- shipping display for new orders must come from `Ship*` fields
- buyer-facing item display for new order items must come from snapshot fields
- relation-based fallback is allowed only for older rows that do not yet have snapshot values

## Rollout Order

Rollout must happen in this order:

1. Apply the Phase 1 migration to existing databases.
2. Verify migrated databases against the Phase 1 checklist.
3. Verify fresh database bootstrap from `01_creates_tables.sql`.
4. Confirm fresh bootstrap matches the migration target.
5. Only then allow any Phase 2 API work to begin.

This order is mandatory because Phase 2 depends on schema parity between:

- migrated DBs
- fresh DB bootstrap environments

## Verification Checklist for Migrated DB

The following must be true after applying the Phase 1 migration to an existing database:

- `orders.buyer_id` is nullable
- `orders.address_id` is nullable
- `payments.user_id` is nullable
- `orders.customer_type` exists
- `orders.guest_full_name` exists
- `orders.guest_email` exists
- `orders.guest_phone` exists
- `orders.ship_full_name` exists
- `orders.ship_phone` exists
- `orders.ship_street` exists
- `orders.ship_city` exists
- `orders.ship_state` exists
- `orders.ship_postal_code` exists
- `orders.ship_country` exists
- `order_items.product_title_snapshot` exists
- `order_items.product_image_snapshot` exists
- `order_items.seller_display_name_snapshot` exists
- the database no longer generates `order_number`
- existing member data still loads without immediate schema failure

Specific migrated DB validation points:

- the `set_order_number` trigger is no longer active
- the `generate_order_number()` function is no longer required for current inserts
- `orders.order_number` still remains unique
- existing orders are backfilled to `customer_type = 'member'`

## Verification Checklist for Fresh DB Bootstrap

The following must be true for a fresh database created from init SQL:

- init SQL creates the same schema target as the Phase 1 migration
- `orders.buyer_id` is nullable
- `orders.address_id` is nullable
- `payments.user_id` is nullable
- `orders.customer_type` exists
- guest fields exist on `orders`
- shipping snapshot fields exist on `orders`
- item snapshot fields exist on `order_items`
- no DB-generated `order_number` behavior exists
- `orders.order_number` remains unique

Fresh bootstrap must not contain:

- `generate_order_number()`
- `set_order_number`
- any other trigger/function that creates or rewrites `order_number`

## Null-Safe Read-Path Watchlist for Later Phases

Phase 1 only aligns schema and bootstrap parity.
It does not make runtime read paths safe by itself.

The following runtime paths remain at risk and must be handled in later phases:

- `OrderService.GetUserOrdersAsync`
- `OrderService.GetOrderByIdAsync`
- `OrderService.MapToDto`
- any path that still assumes `Address` is always present

Why this matters:

- `orders.address_id` is now nullable
- `orders.buyer_id` is now nullable
- legacy mapping code may still assume address-book based shipping is always present
- new shipping source-of-truth is the order snapshot, not the address relation

Until those read paths are updated, schema correctness alone does not guarantee runtime safety.

## Order Number Rule

The Phase 1 order number rule is locked as follows:

- DB trigger/function-based `order_number` generation has been removed or disabled
- DB only enforces uniqueness on `orders.order_number`
- backend service remains the only order number generator

No fresh or migrated environment is allowed to reintroduce DB-generated order number behavior.

## Exit Criteria

Phase 2 must not begin until all of the following are true:

- the Phase 1 migration exists and is reviewable as a single migration
- the migration has been applied successfully to an existing database
- migrated DB verification passes
- fresh DB bootstrap verification passes
- migrated DB and fresh DB have the same Phase 1 schema target
- DB-generated `order_number` behavior is gone in both migrated and fresh paths
- compatibility/fallback rule is understood as compatibility only, not canonical behavior
- the team acknowledges that null-safe runtime read paths are still pending for later phases

Only after these conditions are met may Phase 2 checkout API work begin.
