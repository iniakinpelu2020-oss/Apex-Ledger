# Apex Ledger

Income, payouts and expenses, in the currency you are actually paid in.

**Status: not built. This is the best first real app in the suite.**

## Why this one first

It is small, it is entirely yours, and it needs no backend, no storage quota and no
account. A single browser page with IndexedDB is a complete, working product. It also has
an obvious correctness bar — the numbers either add up or they do not — which makes it a
good place to build habits before the harder projects.

## What it should do

- Record income and expenses with a date, amount, category and note.
- Show a month at a time, and a running balance.
- Export to CSV so it can go into a spreadsheet.
- Work offline, permanently, with data on the device.

## The constraint that shapes it

Money is integers. Store amounts in the smallest unit (kobo, cents) as whole numbers.
Floating point will eventually produce a balance that is off by 0.01 and you will not find
where. This is the one technical decision that matters.

## What you need to do

1. Nothing. No keys, no accounts, no card.

## First three steps

1. A form that records one transaction, stored locally.
2. A month view with totals per category.
3. CSV export, before any charts — export is what makes the data feel real.
