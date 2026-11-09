# Refund-workflow

A refund flow for a food and drink back office. Operations staff open a customer's order and refund part or all of it.

The back office is used across multiple countries, on desktop and tablet browsers.

**Live demo:** https://gxchua.github.io/refund-workflow/

What it includes:

- **Order page:** shows the order (ID, status, store, time placed) and its items, each with its status, plus the delivery fee. A Refund button starts the refund flow.
- **Refund modal, in three steps:**
  1. Select the units, add-ons and delivery fee to refund. The total updates as you select.
  2. Review what will be refunded, and pick a reason and where the money goes.
  3. Confirm the refund. On success, the dialog closes, a banner shows the amount and refund reference, and the order page shows the refunded items as "Refund pending".
- **Mocked API:** runs in the browser and behaves like a real backend. Responses can be slow and can fail. A demo panel lets you trigger failures on demand.

Built with React, TypeScript, Vite, Tailwind CSS and Radix UI.

## Getting started

Requires Node.js 22.12 or later and npm.

```bash
npm install
npm run dev       # start the app at http://localhost:5173
npm test          # run the unit tests once
npm run lint      # lint with oxlint
npm run build     # type-check and build to dist/
npm run preview   # serve the production build
```

No backend or environment variables are needed. The mock API starts with the app.

## Demo panel

The dashed panel in the bottom-left corner ("Demo: API scenario") isn't part of the product. It's there so you can try different cases. Click it to open it.

- **Sample order:** switch between the sample order from the requirements and three extra orders: no delivery fee, a refund pending, and nothing left to refund.
- **Next API response:** choose how the mock API behaves.

  | Scenario | What happens |
  | --- | --- |
  | Normal | Short delay, then success |
  | Slow (3s) | Every request takes 3 seconds |
  | Order fails to load | Loading the order returns `500`, so you can see the error and the Retry button |
  | Refund fails | The next refund returns `500`. "Try again" then succeeds |
  | Refund times out | The next refund is saved but no response arrives. After 10 seconds the app shows a timeout, and "Try again" gets the saved result instead of refunding twice |
  | Item refunded by someone else | Just before the next refund lands, the first selected item is refunded elsewhere. The server returns `409` and the modal goes back to step 1 |
  | Amount mismatch | The next refund returns `409 AMOUNT_MISMATCH` |

  One-time scenarios (the refund ones) switch back to Normal after they fire. Slow and "Order fails to load" stay on until you change them.
- **Reset data:** refunds are saved in the browser's localStorage, so they survive a reload. Reset puts every order back to its starting state.

## Project structure

```
src/
  components/
    ui/        Reusable Radix and Tailwind wrappers (Button, Modal, Checkbox, Alert…)
    order/     Order page and item list
    refund/    Refund modal and its steps
  hooks/       React state: loading the order, the selection, submitting
  services/    API calls (getOrder, createRefund)
  utils/       Plain functions: refund rules, calculation, selection, money, http
  types/       Shared types
  mocks/       Mock backend (MSW handlers, saved data, demo panel)
```

Tests sit next to the code they cover (`*.test.ts`). Business rules don't live in components: what can be refunded is in `utils/refundRules.ts`, and the total is in `utils/refundCalculation.ts`.

## Written section

### a) API endpoints

The refund flow needs two endpoints: one to load an order and one to submit a refund. Both use JSON, and paths are relative to the API base (`/api` in this app).

#### The order payload

The order follows the example in the requirements. I made two changes:

1. **Added `country`, `store_id` and `placed_at`.** The back office is used across countries, so staff need to see which country and store an order came from. `country` also decides how money and dates are formatted. `placed_at` records when the order was placed, and is useful later for filtering orders by date. It is ISO 8601 in UTC (ending in `Z`), so every system reads it the same way, whatever country it runs in.
2. **Added `refund_pending` as a status**, next to `paid` and `refunded`, for units, add-ons and `delivery_fee_status`. A refund is a request, and the money moves later. Until then, the items need to be locked so they can't be refunded twice.

Everything else, including field names and decimal prices, is as in the requirements:

```json
{
  "order_id": "ORD-10482",
  "status": "completed",
  "country": "MY",
  "store_id": "MY-KL-001",
  "placed_at": "2026-10-26T01:15:00Z",
  "currency": "MYR",
  "delivery_fee": 5.00,
  "delivery_fee_status": "paid",
  "items": [
    {
      "line_id": "L1",
      "name": "Iced Spanish Latte",
      "unit_price": 13.90,
      "units": [
        {
          "unit_id": "L1-2",
          "status": "paid",
          "addons": [
            { "addon_id": "A1", "name": "Extra Shot", "unit_price": 2.00, "status": "paid" }
          ]
        }
      ]
    }
  ]
}
```

#### Errors

Every error has the same shape, so the UI can react to each `code`:

```json
{ "error": { "code": "AMOUNT_MISMATCH", "message": "The refund amount has changed. Please review again." } }
```

The codes each endpoint can return are listed under it below.

#### 1. `GET /orders/{order_id}`

Loads one order with all its items. The order page calls it when it opens. The refund modal calls it again every time it opens, so staff always start from the latest data.

**Response `200`:** the order, in the shape above.

**Errors:**

| Status | Code | When |
| --- | --- | --- |
| `404` | `ORDER_NOT_FOUND` | The order doesn't exist |
| `500` | `INTERNAL_ERROR` | Something failed on the server. The page shows the error with Retry |

#### 2. `POST /orders/{order_id}/refunds`

Submits a refund for some or all of an order. An order can be refunded more than once, so each call creates a new refund.

**Header:** `Idempotency-Key: <uuid>`. This stops a refund from going through twice. The app makes one key per refund attempt and sends the same key when staff retry it. If the first request actually went through but the response was lost, the server returns that first result instead of refunding again. A new key is made when the refund itself changes (items, fee, reason, note or channel), or after a `409`.

**Request:**

```json
{
  "units": [
    { "unit_id": "L1-2", "addon_ids": ["A1"] },
    { "unit_id": "L3-1", "addon_ids": [] }
  ],
  "include_delivery_fee": true,
  "reason": "wrong_item",
  "reason_note": null,
  "channel": "original_payment_method",
  "expected_amount": 28.80
}
```

- `units`: the units to refund, each with the add-ons to refund under it. Add-ons sit under their unit because add-on IDs repeat across units (`A1` is on both `L1-1` and `L1-2`). It also means an add-on can't be sent without its unit.
- `include_delivery_fee`: whether to refund the delivery fee.
- `reason`: one of `wrong_item`, `missing_item`, `quality_issue`, `late_delivery`, `other`.
- `reason_note`: required when the reason is `other`, otherwise `null`.
- `channel`: `original_payment_method` or `in_app_credit`.
- `expected_amount`: the total staff saw before confirming. The server works out the amount itself and rejects the refund if the two don't match (see b).

**Response `201`:** the new refund, plus the updated order with the refunded items now `refund_pending`. The order page uses it to refresh without another request.

```json
{
  "refund": {
    "refund_id": "RF-20001",
    "status": "pending",
    "amount": 28.80,
    "currency": "MYR",
    "created_at": "2026-10-27T06:02:11Z"
  },
  "order": { "...": "the updated order" }
}
```

**Errors:**

| Status | Code | When | What the app does |
| --- | --- | --- | --- |
| `404` | `ORDER_NOT_FOUND` | The order doesn't exist | Shows the error |
| `409` | `ITEMS_NOT_REFUNDABLE` | An item is already `refund_pending` or `refunded`, for example because someone else refunded it first | Reloads the order and goes back to step 1, keeping the selections that are still valid |
| `409` | `AMOUNT_MISMATCH` | `expected_amount` doesn't match the server's amount | Same as above |
| `422` | `VALIDATION_ERROR` | Nothing selected, an unknown reason or channel, a missing note for `other`, or no `Idempotency-Key` | Shows the error. The UI blocks these cases before submitting |
| `422` | `IDEMPOTENCY_KEY_REUSED` | The same key was sent with a different request | Shows the error |
| `500` | `INTERNAL_ERROR` | Something failed on the server | Shows the error with "Try again", using the same key |
| — | — | No response within 10 seconds | Says the refund may have gone through, and offers "Try again" with the same key |

### b) Refund calculation

**Both sides calculate it. The frontend shows it, and the backend decides it.**

- **Frontend:** works out the total live as staff tick items, so they see the amount before they confirm. The rule is simple: each selected unit adds its line's `unit_price`, plus the add-ons ticked under it, plus the delivery fee if ticked. Items that are `refunded` or `refund_pending` never count. Example: `L1-2` with Extra Shot, `L3-1` and the delivery fee is 13.90 + 2.00 + 7.90 + 5.00 = MYR 28.80.
- **Backend:** works the amount out again from its own data, and that's the amount that gets refunded, never a number sent by the browser. Anyone with access can call the API directly and skip the UI, for example from the browser's dev tools, so a request could carry a wrong amount on purpose. It could also be wrong by accident, because of a frontend bug or an old copy of the order.

**Keeping the two in sync:**

- The frontend sends the total staff saw as `expected_amount`. If the server's amount is different (for example, the frontend and backend calculations differ because of a bug, a rounding difference, or an outdated page), it rejects the refund with `409` instead of refunding an amount staff never saw.
- If anything changed since the order loaded (an item was refunded or became pending), the server rejects the whole request with `409` instead of refunding a different amount. The UI reloads the order, goes back to step 1 with a message, and keeps the selections that are still refundable, so staff see the new total before confirming again.
- The modal loads the order fresh each time it opens, so a mismatch is rare.
- Money is calculated in whole minor units (sen, cents), not floats, so three croissants (7.90 + 7.90 + 7.90) can't come out as 23.700000000000003. The number of decimals comes from the currency through `Intl`, not hardcoded to 2.
- All "can this be refunded" rules are in one file (`utils/refundRules.ts`) and the calculation uses them, so the total and the checkboxes can't disagree. In this demo the mock server uses the same functions. With a real backend, the backend owns the rules, and the `expected_amount` check catches any drift between the two.

### c) Assumptions and questions

A few parts of the requirements can be read in more than one way. For each one, I've written down the question I'd ask the product manager or designer, what I went with, and why. Most of these rules are in `utils/refundRules.ts`, so if the answer turns out to be different, I only need to update that one file.

1. **Add-on rule: in the same refund, or at any time?**
   - Question: an add-on can't be refunded on its own, and its item has to be refunded too. Does the item need to be in the same refund, or is it enough that it was refunded before?
   - Assumed: it has to be the same refund. In the sample order, `L2-2` was refunded but its add-ons are still `paid`, so they stay locked and show "Drink already refunded". This also means some items in the sample order can never be refunded.
   - Why: it's the safer reading of "cannot be refunded on its own". That said, those leftover add-ons look like a mistake by whoever did the first refund, and the customer may still be owed MYR 2.50. I'd like to know when staff would ever refund a drink but keep its add-ons.
2. **Refunding just an add-on.**
   - Question: sometimes only the add-on goes wrong. Say a customer paid for oat milk, but the barista used normal milk by mistake, and the customer is happy to keep the drink. Or they paid for an extra shot that never made it in. Can staff refund just the oat milk or the shot?
   - Assumed: no, because the rule says the drink must be refunded too.
   - Why: I built the rule as written, since there may be reasons I can't see, such as how payments or accounting record add-ons. But in these cases staff would have to refund the whole drink, or nothing, when MYR 1.50 or MYR 2.00 would have been enough.
3. **What counts as a full refund?**
   - Question: the requirements say selecting all items means a full refund. Does that include the delivery fee, and items that can't be refunded any more?
   - Assumed: it's a full refund when every unit and add-on that can still be refunded is selected. The delivery fee doesn't count, since refunding it is optional.
   - Why: if "full" meant everything in the order, the sample order could never be fully refunded (see point 1).
4. **Delivery fee.**
   - Question: should a full refund always include the fee? Should the fee only be refundable for some reasons, like a late delivery?
   - Assumed: "Select all" ticks the fee along with the items, but staff can untick it, and the refund still counts as full without it (see point 3). The fee can also be refunded on its own, for example for a late delivery, and always in full.
   - Why: the requirements only tie add-ons to their item, not the fee. They also say refunding the fee is optional, so I left the choice to staff in every case.
5. **Order status after a refund.**
   - Question: should the order status change after a full refund, for example to `refunded`?
   - Assumed: no. The order stays `completed`, and each item keeps its own status.
   - Why: the sample order is still `completed` even though some items were refunded.
6. **Reading the order data.**
   - Assumed: each `unit_id` is one physical item, the quantity is the number of units, and `unit_price` and add-on prices are per unit. Add-ons can be on any item, food or drink (like extra cheese on a sandwich), and follow the same rule. Only `completed` orders can be refunded, so it's the only order status the app knows.
   - Why: the payload has no quantity or totals, and this is the only reading that adds up. The add-ons in the requirements are all on drinks, but nothing says food can't have them. And an order that isn't completed yet would be cancelled, not refunded.
7. **Time and money across countries.**
   - Assumed: times are sent in UTC and shown in the device's timezone, like "26 Oct 2026, 9:15 am". Money uses the order's `currency` and shows the currency code, like "MYR 28.80".
   - Why: staff compare "Placed" with their own clock, so their device's timezone makes the most sense. And "$" on its own could mean Singapore or US dollars.
8. **Access.**
   - Assumed: the backend decides which countries, stores and orders each staff member can see and refund.
   - Why: login and navigation are out of scope.
9. **Reason, channel and note (for the designer).**
   - Assumed: there's no default reason or channel. Staff have to pick both, and "Other" needs a note.
   - Why: a default is easy to leave by accident, and money sent to the wrong place is hard to get back.

### d) Key decisions and trade-offs

- **Pending is a status on each item (`refund_pending`), not a separate refund record.**
  - Why: a refund is a request and the money moves later, so items must lock while pending or they could be refunded twice. I extended the item status the sample data already has, because the UI needs exactly that: "can this item be selected?" Even with refund records in the backend, the order response should still give each item its status, so this contract would not change.
  - Trade-off: no refund history (who, when, why, which channel), and if two refunds are pending on one order, item status alone can't tell which items belong to which refund, so a failed refund can't be reverted cleanly. Next step: add refund records with their own status and return them as `refunds: []` on the order. The selection logic wouldn't change.
- **The server is the source of truth for the amount, checked with `expected_amount`.**
  - Why: staff need an instant total, but the browser can't decide how much money is refunded. The check stops a refund for an amount staff didn't see.
  - Trade-off: the rules exist on both sides. A `409` costs staff one extra review, which I think is fine for money.
- **One idempotency key per refund attempt, reused on retries.**
  - Why: an order can be refunded more than once. With the order ID as the key, the server would treat a second, real refund as a retry of the first, and either return the old result or reject it. A key per attempt lets "Try again" after a timeout get the original result back. A new key is made when the refund changes (items, fee, reason, channel or note), or after a `409`. The key does not stop two staff refunding the same items. Item status does: items lock as `refund_pending`, and a second request gets `409`.
  - Trade-off: the key lives in memory, so a reload loses it. This is acceptable because a reload also reloads the order: if the first request went through, the items show as "Refund pending"; if it didn't, staff can refund them with a new key.
- **Business rules in plain functions, not in components.**
  - Why: the PM is likely to change the add-on and full refund rules (see c), and each change should touch one file with tests, not the UI.
  - Trade-off: a few more files than a small app needs.
- **A mock API that behaves like a real one, kept in the live build.**
  - Why: the live demo runs on GitHub Pages, which can't run a backend. I still wanted anyone trying it to see what happens when a request is slow or fails, without having to open dev tools. MSW catches the app's real `fetch` calls, so the services and error handling are the same code I'd use with a real API.
  - Trade-off: the demo panel ships to production. With a real API, I'd turn MSW off and leave the panel out of the build.

### e) Known limitations and next steps

- **Refund history:** refund records with amount, reason, channel and items, shown on the order page.
- **After "pending":** what happens when the payment provider completes or fails a refund (items move to `refunded`, or back to `paid` with a message). Not handled here.
- **Order list and search:** the full flow I had in mind is order list → open an order → order page → Refund. On the list, staff could filter orders by store and date, and search for a specific order by its ID. This needs a `GET /orders` endpoint with paging and those filters.
- **More flexible add-on refunds:** if the PM agrees, refund add-ons whose drink was already refunded (c, point 1), or an add-on on its own when only the add-on went wrong (c, point 2).
- **Tests:** unit tests cover the selection rules, the calculation, request building and the mock server checks. Next: component tests for the modal and one end-to-end test of the full flow.
- **Phone layout:** the requirements ask for desktop and tablet, so phone width isn't designed for.
- **Translations:** money and dates are formatted per order, but only Malaysia has a locale mapped so far; other countries fall back to English formatting. UI text is English only.
- **Error logging:** once the app talks to a real API, log meaningful errors, such as failed or timed-out refunds, so problems can be found and fixed.
- **Permissions:** use the staff member's permissions from the API to hide or disable Refund for people who can't refund, and show an approval step when a refund needs one.

## How I used AI

I used an AI coding assistant as a pair programmer. I made the decisions: reading the requirements, the API shape, the refund rules and the trade-offs above. The assistant helped write code and tests from those decisions, and checked the app against the requirements. I reviewed, tested and changed what it produced, and dropped suggestions I didn't agree with.
