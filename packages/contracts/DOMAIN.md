# Domain Model

The canonical vocabulary for this codebase. Read this before touching anything
that involves users, firms, clients, or roles — the underlying database schema is
flat and confusing, and the word "client" is overloaded. This document pins down
what each term means so new code stays consistent.

> Source of truth: this file describes how we *interpret* the legacy database. The
> legacy C# app encoded the same interpretation in an `AccountingFirm` domain class
> (`MacCore/DomainModels/AccountingFirm.cs`). We deliberately did **not** port that
> class — but the mapping below is faithful to it.

---

## The one thing that confuses everyone: "client"

The word **client** means two different things depending on which layer you're in.
This is the #1 source of bugs and confusion.

| Where | "client" means | Example |
|---|---|---|
| **Database / auth / JWT** | the **firm** (tenant) | `Client_Id`, `firmClientId`, the `Client` table |
| **API / UI** | a **customer of the firm** | `/clients` route, `ClientSummary`, `clients.jsx`, "Add Client" |

Both are intentional and both are staying. The accounting-SaaS convention is that an
accountant's customers are their "clients", so the UI uses that word. But the legacy
DB used "Client" to mean the firm tenant. **When you read `Client`/`Client_Id`, ask
which layer you're in.**

To keep ourselves sane, prefer these unambiguous terms in app-layer code and prose:

- **Firm** — the tenant (legacy `Client` table / `Client_Id`). Avoid calling it "client".
- **Client** — the firm's customer (a `Users` row with `Is_Customer`). This is what the UI shows.
- **Staff** — people who work *at* the firm (owner + employees).
- **Sub-user** — a login nested under a client.

---

## The entities

### Firm (the tenant)

Legacy `Client` table. One row per accounting firm. Notably it carries almost
nothing — **not even a company name** (that lives on the firm owner user, see below).

```
Client { Client_Id (PK), UserName, Email_Address, Is_Active, Created_Date, Modified_Date, Users[] }
```

Every person in the system points at their firm via `Users.Client_Id`.

### User (everyone is one)

There is **one giant flat `Users` table** (~60+ columns). Firm owners, staff,
clients, and sub-users are *all* rows in it. You tell them apart by **boolean role
flags**, not by a type column or separate tables.

Key columns:

| Column | Meaning |
|---|---|
| `UserId` | PK — the identity of any person |
| `Client_Id` | which **firm** this person belongs to |
| `Customer_Id` | groups a client together with its sub-users (see below) |
| `Is_Admin`, `Is_Staff`, `Is_Customer`, `Is_SubUser`, `Is_Employee` | role flags (overlapping!) |
| `Is_Active`, `Is_Locked`, `Is_Verified` | status flags |
| `Company_Name`, `Full_Name`, `Email_Address`, `City`, `State` | profile |
| `Password` | MD5 hash (see auth) |

### Roles — how to decode the flags

Roles are **combinations** of flags, not single columns. This is the part most worth
memorizing:

| Role | Flag rule |
|---|---|
| **Firm owner** | `Is_Admin && !Is_Staff` |
| **Staff** | firm owner **or** `Is_Staff` |
| **Client** (firm's customer) | `Is_Customer` |
| **Sub-user** (under a client) | `Is_SubUser` |

Notes / gotchas:

- The legacy code treats the firm's customers as `Is_Customer || Is_SubUser`, then
  **groups by `Customer_Id`**: within a group, the top-level client is
  `Is_Customer && !Is_SubUser` and its children are `Is_SubUser`. The current rebuild
  lists clients **flat** (`Is_Customer` only) and **does not surface sub-users yet** —
  keep that in mind when adding client-detail or sub-user features.
- **Firm name comes from the owner user's `Company_Name`**, not from the `Client`
  table. If you need a firm's display name, resolve the owner first.
- The legacy owner detection (`Is_Admin && !Is_Staff`) is fragile: an owner who also
  has `Is_Staff` set would not be detected, and downstream code would NPE on the
  missing owner. If you write owner-resolution logic, guard for "no owner found".

### "Active" — pick one definition

The legacy code had **three** different notions of active, which disagree with each
other. Don't repeat that. For this rebuild, the committed definition is:

> A client/user is **active** when `Is_Active === true && Is_Locked === false`.

(Avoid the legacy `Email_Address === "inactive"` string hack — it exists in old data
but is not our rule.)

---

## How the rebuild maps it today

| Concept | Code |
|---|---|
| Logged-in person | `SessionUser` (`contracts/src/auth.ts`) |
| Their firm | `SessionUser.firmClientId` (= `Users.Client_Id`) |
| Their roles | `SessionUser.roles.{isStaff,isCustomer,isEmployee,isAdmin}` |
| Listing a firm's clients | `clientsRepository.list(firmClientId)` → `/clients` → `ClientSummary[]` |
| A client (customer) row | `ClientRow` (`db`) → `ClientSummary` (`contracts/src/clients.ts`) |

Access rule in effect: `/clients` is `requireStaff` and is scoped to the caller's
`firmClientId`, so staff only ever see their own firm's clients.

---

## Quick reference

- `Client` table / `Client_Id` / `firmClientId` → **the firm**, never a customer.
- `ClientSummary` / `ClientRow` / `/clients` → **a customer of the firm**.
- Everyone is a `Users` row; role = flag combination, not a column.
- Firm name lives on the **owner** user, not the `Client` row.
- Active = `Is_Active && !Is_Locked`.
- Clients and sub-users are linked by `Customer_Id`; sub-users aren't surfaced yet.
