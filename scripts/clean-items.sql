-- Clean existing items before schema migration
-- Run this manually via: psql $DATABASE_URL -f scripts/clean-items.sql
-- Or execute in your database client

DELETE FROM "Item";










