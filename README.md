# Apex Ledger

Income, expenses and a monthly balance that stay on this device. Vanilla HTML/CSS/JS with relative
`./` paths, so it runs from `/apps/ledger/` inside the ApexOS bundle and works offline.

## Run

```sh
python3 -m http.server 8080
# then open http://127.0.0.1:8080/
```

## What it does

- **Month navigation** in the header; tap the month name to jump back to the current month.
- **Three totals** for the selected month: income, expenses and the net balance, coloured by sign.
- **Entries** grouped by date, newest first, with category, note and a signed amount.
- **Breakdown** of the month's expenses by category, sorted largest first with proportional bars.
- **Categories** per type (expense and income), with your own added or removed. Removing a category
  in use warns how many entries keep the old label.
- **Currency symbol** for £, $, €, ¥ or ₦ — display only, no conversion.

## Storage

One `localStorage` key, `apex.ledger.v1`:

```json
{
  "currency": "£",
  "entries": [
    { "id": "…", "type": "out", "amount": 1250, "category": "Food",
      "note": "Lunch", "date": "2026-11-18", "created": 1763472000000 }
  ],
  "cats": { "out": ["Food", "Rent"], "in": ["Salary", "Gift"] }
}
```

Amounts are **integer minor units** (pence, cents) so no float rounding creeps into totals. Totals
are summed at render time by filtering on the `YYYY-MM` prefix of `date`, which keeps entries in the
month you recorded them regardless of timezone.

## Bundling into ApexOS

Roster entry `Apex-Ledger ledger`. Keep paths relative and bump `CACHE` in `sw.js`
(`apex-ledger-v1`) when shell files change.
