# Database approach

We use SQLite for the MVP. Each user owns exactly one board for now, but the schema supports multiple users and boards for future expansion.

## Tables

- users: one row per user (username is unique)
- boards: one row per board, linked to users
- columns: ordered columns per board (position integer)
- cards: ordered cards per column (position integer)

## Relationships

- users 1:N boards
- boards 1:N columns
- columns 1:N cards

All foreign keys use ON DELETE CASCADE to keep related data consistent.

## Ordering

- columns.position defines column ordering in a board
- cards.position defines card ordering within a column

## Time fields

Timestamps are stored as ISO 8601 strings in TEXT columns for simplicity.
