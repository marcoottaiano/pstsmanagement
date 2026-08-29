# Technical Requirements

## 1. Project Overview

The application is a multi-user web platform used to organize the annual work of a gymnastics club, divided into Artistic Gymnastics and Rhythmic Gymnastics.

The application must be designed primarily as a single operational dashboard.

After authentication, the user works mainly from one page containing:

- application header;
- group filters;
- monthly calendar;
- reminders panel;
- objectives panel;
- group tree management modal.

The UI contents change according to the selected sector and group filter without navigating to separate pages.

---

# 2. Technology Stack

Use the following stack.

## Core

- Next.js
- App Router
- React
- TypeScript
- Node.js
- npm

Always use the latest stable compatible versions available when the project is initialized.

Do not use the Pages Router.

## Backend

Use Supabase for:

- PostgreSQL database;
- authentication;
- authorization through Row Level Security;
- server-side access to application data.

Do not implement a separate backend application.

## UI

Use:

- Mantine;
- `@mantine/core`;
- `@mantine/hooks`;
- `@mantine/form` only if needed;
- `@mantine/dates`;
- `@mantine/notifications`;
- Tabler Icons.

Mantine must be the primary design system of the application.

Avoid introducing other UI component libraries unless strictly necessary.

## Calendar

Use FullCalendar Standard.

Required packages:

```bash
npm install \
  @fullcalendar/react \
  @fullcalendar/core \
  @fullcalendar/daygrid \
  @fullcalendar/timegrid \
  @fullcalendar/interaction
```

The application must not depend on FullCalendar Premium features.

The initial calendar view must be monthly.

## Validation

Use Zod for shared validation schemas.

Forms can use Mantine form utilities or React Hook Form if a form becomes complex.

Do not maintain two competing form patterns without a clear reason.

---

# 3. General Architecture

Use a feature-oriented architecture.

Business logic must not be placed directly inside large UI components.

Separate:

- UI;
- data fetching;
- mutations;
- validation;
- domain types;
- database mapping;
- filter logic.

Suggested structure:

```text
src/
├── app/
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── groups/
│   ├── calendar/
│   ├── reminders/
│   └── objectives/
│
├── lib/
│   ├── supabase/
│   ├── validation/
│   ├── dates/
│   └── utils/
│
├── types/
│
└── config/
```

Each feature should contain its own components, hooks, schemas, types and data-access utilities when applicable.

Example:

```text
features/
└── reminders/
    ├── components/
    │   ├── ReminderCard.tsx
    │   ├── ReminderForm.tsx
    │   └── ReminderList.tsx
    │
    ├── hooks/
    │   └── useReminders.ts
    │
    ├── reminders.actions.ts
    ├── reminders.schemas.ts
    ├── reminders.types.ts
    └── index.ts
```

Avoid excessively fragmented code. Small components that have no reuse or architectural value do not need to exist as separate files.

---

# 4. Authentication

Authentication must use Supabase Auth.

There must NOT be a public registration page.

The application only requires:

```text
/login
/dashboard
```

Users are invited by an application administrator from the protected user-management page.

There must be no public self-registration flow.

The login screen must support email and password authentication.

Unauthenticated users trying to access the dashboard must be redirected to `/login`.

Authenticated users navigating to `/login` should be redirected to `/dashboard`.

Logout must invalidate the Supabase session and redirect to `/login`.

---

# 5. Users

Supabase Auth manages authentication identities.

Create an application-level profile table associated with `auth.users`.

Suggested table:

```text
profiles
```

Fields:

```text
id UUID PRIMARY KEY
display_name TEXT NOT NULL
email TEXT
role TEXT NOT NULL DEFAULT 'MEMBER'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

`profiles.id` must reference the corresponding Supabase Auth user ID.

The UI must display:

- user name;
- user avatar/icon;
- logout action.

Real avatar uploads are not required for the initial version.

A generated avatar containing initials is sufficient.

---

# 6. Sectors

The application contains two sectors:

```text
artistic
rhythmic
```

Do not hard-code access based exclusively on frontend conditions.

Create a database representation of sectors.

Suggested table:

```text
sectors
```

Fields:

```text
id UUID PRIMARY KEY
code TEXT UNIQUE NOT NULL
name TEXT NOT NULL
```

Seed values:

```text
artistic → Ginnastica Artistica
rhythmic → Ginnastica Ritmica
```

---

# 7. User Sector Access

A user may have access to:

- Artistic Gymnastics only;
- Rhythmic Gymnastics only;
- both sectors.

Use a many-to-many relation.

Table:

```text
user_sectors
```

Fields:

```text
user_id UUID
sector_id UUID
```

Unique constraint:

```text
(user_id, sector_id)
```

All authenticated users with access to a sector have the same permissions over sector planning
data.

The application has two coarse roles:

```text
ADMIN
MEMBER
```

Any valid authenticated user may create, update and delete planning data belonging to an
accessible sector. Only an `ADMIN` may invite users and change their sector access.

Administrative authorization must be checked on the server and in database operations. Hiding
the administration link in the frontend is not a security mechanism.

---

# 8. Authorization

Use Supabase Row Level Security.

RLS must be enabled on application tables containing sector-specific data.

A user can read and modify records only if those records belong to a sector present in their `user_sectors`.

Frontend filtering must never be considered a security mechanism.

RLS is the source of truth for sector authorization.

Users with both sectors can access both.

---

# 9. Group Hierarchy

Groups must support a hierarchical tree.

Example:

```text
Avanzato
├── Avanzato 1
│   ├── Eccellenza 1
│   └── Eccellenza 2
├── Avanzato 2
└── Avanzato 3
```

Top-level groups such as:

```text
Base
Intermedio
Avanzato
```

are groups like every other node and can directly own application data.

Groups may contain other groups.

Do not assume that only leaf nodes are valid groups.

Example:

```text
Avanzato 1
├── Eccellenza 1
└── Eccellenza 2
```

`Avanzato 1` is still a valid group.

---

# 10. Group Database Model

Use a single hierarchical table.

Suggested table:

```text
group_nodes
```

Fields:

```text
id UUID PRIMARY KEY
sector_id UUID NOT NULL
parent_id UUID NULL
name TEXT NOT NULL
sort_order INTEGER
is_archived BOOLEAN DEFAULT FALSE
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

`parent_id` references another `group_nodes.id`.

Every node belongs to exactly one sector.

A child must always belong to the same sector as its parent.

The application should support arbitrary hierarchy depth at database level.

The UI should remain usable with approximately 3-4 levels.

---

# 11. Descendant Resolution

Filtering must operate recursively.

When a group is selected, the application must include that group and all its descendants.

Example:

```text
Selected:
Avanzato 1

Resolved scope:
Avanzato 1
Eccellenza 1
Eccellenza 2
```

This descendant resolution must be centralized.

Do not duplicate recursive tree/filter logic separately inside calendar, reminder and objective components.

Create a reusable domain function or database query for resolving the selected node scope.

---

# 12. Dashboard

The primary authenticated page is:

```text
/dashboard
```

The page layout must be approximately:

```text
┌─────────────────────────────────────────────────────────────┐
│ Logo                                      User / Logout     │
├─────────────────────────────────────────────────────────────┤
│ Group filters                      Manage groups            │
├───────────────────────────────────────┬─────────────────────┤
│                                       │ Reminders           │
│                                       ├─────────────────────┤
│              Calendar                 │ Objectives          │
│                                       │                     │
│                                       │                     │
└───────────────────────────────────────┴─────────────────────┘
```

The calendar must occupy most of the available desktop width.

Suggested desktop proportions:

```text
Calendar: 70-80%
Sidebar: 20-30%
```

Do not hard-code these percentages if a more responsive CSS Grid layout works better.

---

# 13. Header

The dashboard header must contain:

Left:

- application/company logo.

Right:

- user icon/avatar;
- display name;
- logout action.

Keep the header compact because the calendar must maximize vertical space.

---

# 14. Sector Selection

If the authenticated user belongs to only one sector:

- automatically use that sector;
- do not require a sector selection step.

If the authenticated user has access to both sectors:

- provide a sector selector in the dashboard filter area.

Changing sector must:

- reset incompatible group filters;
- reload groups;
- reload calendar data;
- reload relevant reminders;
- reset objectives if no group is selected.

---

# 15. Filter Bar

A filter bar must exist directly above the main content.

The hierarchy must be represented through progressive selects.

Example:

```text
Avanzato
→ Avanzato 1
→ Eccellenza 1
```

Selecting a value in one level determines the available values in the next select.

The user can stop filtering at any level.

Examples:

```text
No selection
```

means general view.

```text
Avanzato
```

means all descendant groups of Avanzato.

```text
Avanzato > Avanzato 1
```

means Avanzato 1 and all its descendants.

```text
Avanzato > Avanzato 1 > Eccellenza 1
```

means Eccellenza 1 and its descendants.

The filter bar must include an action to reset the selection.

---

# 16. Filter State

Persist dashboard filter state in URL search parameters where practical.

Example:

```text
/dashboard?sector=artistic&group=<uuid>
```

Do not use array indexes or group names as identifiers.

Use stable IDs.

The application must continue to behave correctly after:

- browser refresh;
- browser back;
- browser forward;
- direct navigation to a filtered dashboard URL.

---

# 17. Group Management

At the right side of the filter bar there must be a button similar to:

```text
Gestisci gruppi
```

It opens a Mantine modal.

The modal must display the hierarchy as a tree.

Required actions:

- create group;
- create subgroup;
- rename group;
- move group;
- reorder siblings;
- archive group;
- delete group where allowed.

Do not allow circular parent relations.

Do not allow nodes to be moved between sectors.

Deleting a node containing application data must require explicit handling.

Prefer archive over destructive deletion when the node has historical data.

---

# 18. Calendar

Use FullCalendar.

Default view:

```text
dayGridMonth
```

The calendar must support:

- displaying scheduled work;
- displaying reminders with deadlines;
- clicking events;
- drag-and-drop;
- event resizing if an event has a meaningful duration;
- navigation between calendar periods.

The initial MVP should prioritize monthly visualization.

Weekly or daily views may be added if they are useful without redesigning the domain model.

---

# 19. Calendar Event Types

Do not store FullCalendar events directly as the business data model.

FullCalendar must be treated as a presentation layer.

Create an application-level event representation.

Example:

```ts
type CalendarItem = ScheduledWorkCalendarItem | ReminderCalendarItem;
```

Each item should contain enough metadata to determine:

- item ID;
- item type;
- title;
- start;
- end if applicable;
- group;
- sector;
- status.

Convert domain entities to FullCalendar events in a dedicated mapper.

---

# 20. Scheduled Work

Create an entity representing work planned for a group.

Suggested table:

```text
scheduled_work
```

Fields:

```text
id UUID PRIMARY KEY
sector_id UUID NOT NULL
group_id UUID NOT NULL
title TEXT NOT NULL
description TEXT
start_at TIMESTAMPTZ NOT NULL
end_at TIMESTAMPTZ
all_day BOOLEAN DEFAULT FALSE
created_by UUID NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

`group_id` must reference any active group in the hierarchy.

Future fields can be added later for:

- training structure;
- notes;
- completion;
- actual work performed.

Do not over-model these future requirements during the initial implementation.

---

# 21. Calendar Filtering

With no group selected:

```text
show scheduled work from all groups available in the active sector
```

With a node selected:

```text
show scheduled work belonging to every resolved group in that subtree
```

This includes the selected group itself.

---

# 22. Calendar Drag and Drop

FullCalendar drag-and-drop must be enabled for scheduled work.

When an event is moved:

1. update the calendar visually;
2. persist the new date/time to Supabase;
3. show a success notification when appropriate;
4. revert the FullCalendar event if the mutation fails;
5. show an error notification.

Do not update the database continuously while an item is being dragged.

Persist only after the drop action.

Reminder deadline drag-and-drop may use the same behavior.

---

# 23. Reminders

Create a reminder entity.

Suggested table:

```text
reminders
```

Fields:

```text
id UUID PRIMARY KEY
sector_id UUID NOT NULL
group_id UUID NULL
title TEXT NOT NULL
description TEXT
due_at TIMESTAMPTZ
status TEXT NOT NULL
completed_at TIMESTAMPTZ NULL
completed_late BOOLEAN NOT NULL DEFAULT FALSE
priority TEXT NULL
created_by UUID NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Suggested statuses:

```text
OPEN
COMPLETED
```

Keep the initial status model intentionally simple.

When a reminder is completed, the database stores the completion timestamp and whether it was
completed after its deadline. For all-day reminders, completion remains on time throughout the due
date in the `Europe/Rome` timezone. This historical flag remains unchanged while the reminder stays
completed and is cleared if the reminder is reopened.

An open reminder due today generates one in-app notification per recipient. The notification is
deduplicated by recipient, reminder and kind, and all-day reminders become overdue only on the next
calendar day in the `Europe/Rome` timezone.

A reminder may optionally belong to any active group in the shared hierarchy. Scheduled work,
reminders and objectives all use the same group association model.

A reminder is always created as `OPEN`. Its status is not editable in the create/edit form and may
change only through the dedicated complete/reopen action.

A reminder without `group_id` is considered general/personal rather than tied to a specific group.

---

# 24. Reminder Assignees

A reminder can be assigned to multiple users.

Use a many-to-many table.

```text
reminder_assignees
```

Fields:

```text
reminder_id UUID
user_id UUID
```

Unique constraint:

```text
(reminder_id, user_id)
```

The reminder creator can:

- assign it to themselves;
- assign it to another user;
- assign it to multiple users.

Only users belonging to the appropriate sector should be selectable as assignees for a sector-specific reminder.

---

# 25. Reminder Visibility

Reminder visibility must be enforced consistently by database queries and RLS policies.

A reminder without `group_id` is personal/general. It is visible only to:

- its creator;
- its assignees.

A reminder with `group_id` is sector/group data. When its group belongs to the currently resolved
filter scope, it is visible to:

- its creator;
- its assignees;
- every authenticated user with access to its sector.

Group filters must not hide personal/general reminders that are visible to the current user.

The reminder sidebar must prioritize reminders assigned to the current user, followed by other visible reminders relevant to the selected group scope.

Users with sector access may modify visible group reminders. Personal/general reminders may be modified only by their creator or assignees.

Avoid returning every reminder in the database and filtering exclusively client-side.

Filter at query/database level where possible.

---

# 26. Reminder Calendar Integration

If a reminder contains `due_at`, it must also appear in FullCalendar.

A reminder calendar item must remain linked to the original reminder entity.

Clicking it must open the reminder detail/edit UI.

The calendar should visually distinguish:

```text
Scheduled work
Reminder
```

Do not duplicate reminder data in a second calendar-specific database table.

---

# 27. Reminder Sidebar

The right sidebar must always display the reminder card.

Required features:

- list reminders;
- create reminder;
- edit reminder;
- complete reminder;
- delete reminder;
- assign users;
- set deadline;
- optionally associate with group.

Suggested visual grouping:

```text
Overdue
Today
Upcoming
Completed
```

If this becomes visually excessive, use:

```text
Open
Completed
```

as the initial MVP.

---

# 28. Objectives

Create an objective entity.

Suggested table:

```text
objectives
```

Fields:

```text
id UUID PRIMARY KEY
sector_id UUID NOT NULL
group_id UUID NOT NULL
title TEXT NOT NULL
description TEXT
status TEXT NOT NULL
completed_at TIMESTAMPTZ NULL
completed_late BOOLEAN NOT NULL DEFAULT FALSE
period_start DATE NULL
period_end DATE NULL
created_by UUID NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Suggested initial statuses:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

The status advances from `NOT_STARTED` to `IN_PROGRESS`, then to `COMPLETED`.
An objective whose `period_end` has passed is considered overdue without introducing a separate
status. Completion timestamp and late-completion outcome are stored for historical statistics.

An objective must always belong to an active group.

---

# 29. Objectives Panel

The objectives card is located below reminders.

It must NOT be displayed in the general dashboard view.

When no group filter is selected:

```text
Objectives card hidden
```

When a node is selected:

```text
Objectives card visible
```

The card must display objectives from every group contained in the selected subtree.

Example:

```text
Selected:
Avanzato 1

Objectives:
Avanzato 1
Eccellenza 1
Eccellenza 2
...
```

Every objective must clearly show its associated group.

---

# 30. Objectives CRUD

Users with sector access may:

- create objectives;
- edit objectives;
- update status;
- delete objectives.

When creating an objective while a group filter is active, preselect the current group. Any active
group in the hierarchy is a valid objective owner.

---

# 31. Responsive Behaviour

Desktop is the primary usage mode.

The application must still remain usable on tablet and mobile.

Desktop:

```text
Calendar | Sidebar
```

Tablet:

- calendar remains primary;
- sidebar can become narrower or collapsible.

Mobile:

Do not force calendar and sidebar into two small columns.

Prefer:

```text
Calendar
Reminders
Objectives
```

through tabs, segmented controls, drawers or vertical stacking.

Group filters must remain usable on small screens.

Progressive selects may wrap onto multiple lines.

---

# 32. Data Fetching

Prefer server-side data loading when it simplifies authentication and initial rendering.

Interactive dashboard features may use client-side fetching/mutations where appropriate.

Do not fetch the entire database and filter everything in React.

Queries must be scoped by:

- authenticated user;
- sector;
- selected group subtree;
- current calendar range when applicable.

For FullCalendar, preferably fetch scheduled items only for the currently relevant date range instead of the entire sports year.

---

# 33. Mutations

Mutations must be centralized.

Avoid direct Supabase mutation calls scattered throughout presentation components.

Example:

```text
createReminder
updateReminder
deleteReminder
createObjective
updateObjective
createGroupNode
updateScheduledWork
```

Mutations must:

- validate input;
- verify authentication;
- rely on RLS for final authorization;
- return predictable success/error results;
- trigger appropriate UI refresh/update.

---

# 34. Validation

Use Zod schemas for business inputs.

Create schemas for at least:

```text
group node
scheduled work
reminder
objective
login
```

The frontend and server mutation layer should reuse schemas where possible.

Database constraints remain the final integrity layer.

Do not rely exclusively on frontend validation.

---

# 35. TypeScript Rules

Use strict TypeScript.

Required:

```text
strict: true
```

Avoid:

```ts
any;
```

Do not use `any` unless interfacing with an unavoidable untyped third-party API.

Prefer:

- explicit domain types;
- discriminated unions;
- inferred Zod types;
- generated Supabase database types.

Avoid unsafe type assertions such as:

```ts
value as SomeType;
```

unless the assertion is technically unavoidable and locally justified.

Do not use non-null assertions as a substitute for correct control flow.

---

# 36. React Rules

Prefer small and understandable components.

Do not put:

- fetching;
- transformations;
- mutations;
- complex state;
- large JSX trees;

inside the same component.

Extract domain behaviour into hooks or feature utilities when it improves readability.

Avoid premature `useMemo` and `useCallback`.

Only use memoization when:

- required for referential stability;
- needed by a third-party API;
- solving an observed rendering/performance problem.

Do not add memoization automatically.

---

# 37. State Management

Do not introduce Redux.

Do not introduce Zustand initially.

Use:

- server data;
- URL search parameters;
- local component state;
- form state;

as the main state sources.

Only introduce a global client state library if a concrete requirement appears that cannot be handled cleanly with these tools.

---

# 38. URL State

Important dashboard navigation state should be reflected in the URL where useful.

Suggested search parameters:

```text
sector
group
```

Optional later:

```text
date
calendarView
```

Do not store transient states such as open modals in the URL unless they need deep-linking.

---

# 39. Loading States

Provide explicit loading states for:

- initial dashboard;
- calendar;
- reminders;
- objectives;
- group tree;
- mutations.

Use Mantine Skeleton or Loader where appropriate.

Avoid blank sections during network operations.

---

# 40. Error Handling

Use Mantine Notifications for mutation feedback.

Examples:

```text
Promemoria creato
Obiettivo aggiornato
Lavoro spostato
Errore durante il salvataggio
```

Do not expose raw Supabase/database errors directly to users.

Log technical details separately where useful.

Provide recoverable UI states for failed queries.

---

# 41. Confirmation Dialogs

Require confirmation for destructive actions such as:

- deleting group;
- deleting reminder;
- deleting objective;
- deleting scheduled work.

Archiving a group should generally be preferred over deleting historical data.

---

# 42. Date Handling

Store timestamps using timezone-aware database fields:

```text
TIMESTAMPTZ
```

Use ISO-compatible values when exchanging date/time information.

UI dates must be displayed in Italian conventions.

The application timezone should initially assume:

```text
Europe/Rome
```

Do not manually manipulate timezone offsets using string operations.

---

# 43. Localization

Initial application language:

```text
Italian
```

User-visible text must be centralized enough to allow future localization.

Do not hard-code the same labels repeatedly across unrelated components.

A full internationalization framework is not required for the MVP unless needed later.

---

# 44. Styling

Use Mantine as the primary styling system.

Create a centralized Mantine theme.

Define application-level tokens for:

- primary color;
- spacing;
- border radius;
- typography;
- component defaults.

Do not scatter arbitrary colors across components.

FullCalendar must be visually customized so that it integrates with the Mantine theme.

---

# 45. FullCalendar Styling

FullCalendar must visually behave as part of the application rather than an embedded third-party widget.

Customize:

- toolbar;
- buttons;
- event appearance;
- typography;
- borders;
- spacing;
- hover states.

Prefer CSS variables/theme integration rather than excessive one-off selectors.

---

# 46. Accessibility

Interactive elements must be keyboard accessible where practical.

Buttons containing only icons must include accessible labels/tooltips.

Form inputs must have labels.

Do not communicate status exclusively through color.

Modal focus behaviour must remain accessible.

---

# 47. Database Migrations

Database schema changes must be reproducible.

Do not rely only on manually creating tables from the Supabase dashboard.

Maintain SQL migrations in the repository.

Suggested:

```text
supabase/
└── migrations/
```

Migrations should include:

- tables;
- indexes;
- foreign keys;
- constraints;
- RLS configuration;
- policies;
- helper database functions if needed.

---

# 48. Seed Data

Provide optional development seed data.

Include:

- both sectors;
- sample users only if technically convenient;
- sample group tree;
- sample groups;
- sample scheduled work;
- sample reminders;
- sample objectives.

Example group tree:

```text
Artistica

Avanzato
├── Avanzato 1
│   ├── Eccellenza 1
│   └── Eccellenza 2
├── Avanzato 2
└── Avanzato 3
```

Seed data must not be required in production.

---

# 49. Database Indexes

Add indexes for common filtering paths.

At minimum evaluate indexes on:

```text
group_nodes.sector_id
group_nodes.parent_id

scheduled_work.sector_id
scheduled_work.group_id
scheduled_work.start_at

reminders.sector_id
reminders.group_id
reminders.due_at
reminders.created_by

reminder_assignees.user_id
reminder_assignees.reminder_id

objectives.sector_id
objectives.group_id
```

Avoid adding speculative indexes without a query pattern.

---

# 50. Database Integrity

Use foreign keys.

Use cascading deletion only where semantically safe.

Do NOT automatically cascade deletion from a group into historical scheduled work, reminders or objectives without explicitly considering data-loss consequences.

Prefer:

```text
archive group
```

instead of deleting groups that already contain historical information.

---

# 51. Environment Variables

Required environment variables must be documented in:

```text
.env.example
```

Never commit secrets.

Expected variables include Supabase project configuration.

Do not expose privileged Supabase credentials to client components.

Only public/publishable credentials may be available client-side.

---

# 52. Supabase Clients

Create centralized Supabase client utilities.

Suggested structure:

```text
lib/
└── supabase/
    ├── client.ts
    ├── server.ts
    └── middleware/proxy utilities if required
```

Do not instantiate ad-hoc clients throughout the component tree.

Separate browser and server usage.

---

# 53. Security

Never use a Supabase service-role key in browser code.

Never bypass RLS from client-facing application paths.

All application tables with user-accessible data must have appropriate RLS policies.

Validate all mutation inputs.

Do not trust group IDs or sector IDs provided by the client without database authorization.

---

# 54. Performance

Do not optimize prematurely.

However:

- query only relevant calendar ranges;
- filter in database where practical;
- avoid unnecessary realtime subscriptions;
- avoid loading archived nodes unless requested;
- avoid N+1 query patterns;
- avoid large client-side filtering of application-wide datasets.

---

# 55. Realtime

Supabase Realtime is NOT required for the initial MVP.

Do not add realtime subscriptions by default.

The application can refresh/revalidate data after successful mutations.

Realtime may be introduced later if simultaneous collaboration becomes a real requirement.

---

# 56. Testing

At minimum, business logic should be structured so it can be tested independently.

Priority test targets:

```text
group descendant resolution
filter scope resolution
calendar domain → FullCalendar mapping
validation schemas
reminder visibility logic
objective visibility logic
```

End-to-end tests can be added later for critical flows.

Do not prioritize snapshot testing of presentational components.

---

# 57. Linting and Formatting

Configure:

- ESLint;
- Prettier if desired;
- TypeScript strict checking.

Before considering a task complete, the project should pass:

```bash
npm run lint
npm run build
```

and, if configured:

```bash
npm run typecheck
npm test
```

Do not suppress lint errors globally to make the build pass.

---

# 58. Naming Conventions

Database:

```text
snake_case
```

TypeScript:

```text
camelCase → variables/functions
PascalCase → components/types
UPPER_CASE → enum-like constants where appropriate
```

React component files:

```text
PascalCase.tsx
```

Hooks:

```text
useSomething.ts
```

Schemas:

```text
something.schema.ts
```

Keep naming domain-oriented rather than generic.

Prefer:

```text
useReminders
ObjectiveCard
GroupTree
ScheduledWorkForm
```

over:

```text
useData
InfoCard
TreeComponent
FormModal
```

---

# 59. MVP Scope

The first implementation must include:

## Authentication

- login;
- logout;
- protected dashboard.

## Sector access

- single-sector user;
- dual-sector user;
- sector switch when required.

## Group management

- group/subgroup hierarchy;
- create;
- rename;
- move/reorder if reasonably implementable;
- archive;
- tree modal.

## Filters

- progressive group selects;
- recursive descendant filtering;
- reset filter.

## Calendar

- monthly FullCalendar;
- scheduled work;
- reminders with deadline;
- create/edit work;
- drag-and-drop;
- filtering.

## Reminders

- create;
- edit;
- delete;
- complete;
- deadline;
- multiple assignees;
- optional group association;
- sidebar display;
- calendar display.

## Objectives

- hidden in general view;
- visible after group selection;
- recursive group scope;
- create;
- edit;
- delete;
- status management.

---

# 60. Explicitly Out of Scope for Initial MVP

Do not implement unless requested later:

- public registration;
- social login;
- granular admin roles;
- athlete management;
- attendance;
- payments;
- subscriptions;
- emails;
- push notifications;
- native mobile application;
- file attachments;
- realtime collaborative editing;
- analytics dashboard;
- complex reports;
- PDF export;
- Excel export;
- chat;
- FullCalendar Premium features;
- complex recurring-event engine.

The architecture should not actively prevent future additions, but do not build abstractions for features that are not currently required.

---

# 61. Implementation Principle

Prefer the simplest architecture that satisfies the current requirements.

Do not introduce abstractions, libraries or infrastructure without a concrete current use case.

In particular avoid:

```text
Redux
Zustand without necessity
Prisma
custom backend server
microservices
repository/service/controller layers copied from backend frameworks
premature generic component systems
premature realtime
```

Keep Supabase as the primary persistence and authorization layer and Next.js as the application layer.

---

# 62. Source of Truth

Functional behaviour is defined by:

```text
requirements.md
```

Technical implementation constraints are defined by this document.

If implementation details conflict with functional requirements:

1. preserve the functional behaviour;
2. adapt the implementation;
3. do not silently change product behaviour.

If a requirement is ambiguous, prefer the smallest implementation consistent with the existing requirements instead of inventing additional functionality.

---

# 63. Recommended Initial Development Order

Implement the project as a sequence of testable vertical phases. Each phase must leave the application in a working state and must include the relevant validation, loading, error, responsive and accessibility behaviour rather than deferring all quality work to the end.

## Phase 0 - Product and delivery baseline

1. Resolve the blocking product decisions listed in the functional and technical requirements.
2. Confirm the Supabase development and production environments.
3. Confirm the source repository and Vercel project ownership.
4. Define the environment-variable strategy for local, preview and production deployments.

Exit condition: required external resources and product decisions are available, with no secrets committed to the repository.

## Phase 1 - Project foundation

1. Initialize Next.js App Router with strict TypeScript.
2. Configure linting, formatting and automated tests.
3. Configure Mantine, the application theme, notifications and Italian date support.
4. Establish the feature-oriented folder structure and shared conventions.
5. Create `.env.example` and a minimal Vercel preview deployment.

Exit condition: the clean application passes lint, type-check, tests and production build locally and in the deployment pipeline.

## Phase 2 - Database and security foundation

1. Configure the Supabase CLI/project link and centralized browser/server clients.
2. Create reproducible migrations for profiles, sectors and user-sector access.
3. Create migrations for group nodes, scheduled work, reminders, reminder assignees and objectives, including foreign keys, constraints and indexes.
4. Add database functions or constraints for cross-table integrity that cannot be expressed with simple foreign keys, including same-sector relationships and archived-group protection.
5. Add RLS helper functions and policies for every application table.
6. Add deterministic development seed data and generate TypeScript database types.
7. Add database-level tests for constraints, recursive scope resolution and denied cross-sector access.

Exit condition: a fresh Supabase environment can be rebuilt from migrations, authorized access succeeds and unauthorized cross-sector access fails.

## Phase 3 - Authentication and sector access

1. Implement login, logout and session refresh using Supabase Auth.
2. Protect `/dashboard` and redirect authenticated users away from `/login`.
3. Load the authenticated profile and accessible sectors.
4. Automatically select a single sector and provide URL-backed selection for dual-sector users.
5. Implement the initial header and authenticated dashboard shell.

Exit condition: single-sector and dual-sector test users complete the authentication and sector-selection flows correctly on refresh and direct navigation.

## Phase 4 - Group hierarchy and filter scope

1. Implement and test centralized recursive descendant group resolution.
2. Implement group/subgroup CRUD, archive, safe delete, move and sibling reorder.
3. Implement the management tree modal with cycle and cross-sector protections.
4. Implement progressive selects, reset and URL-backed filter state.
5. Validate stale or unauthorized URL parameters and fall back safely.

Exit condition: tree mutations and recursive filtering work for arbitrary depth, including after refresh, browser back/forward and direct navigation.

## Phase 5 - Scheduled work and calendar

1. Implement scheduled-work schemas, queries, mutations and forms.
2. Implement the calendar domain model and dedicated FullCalendar mapper.
3. Integrate the monthly calendar and fetch only the visible date range and active group scope.
4. Implement create, edit, delete, event click, drag-and-drop and meaningful resize behaviour.
5. Revert optimistic calendar changes when persistence fails.

Exit condition: scheduled work is correctly scoped, survives refresh and cannot be attached to archived groups or inaccessible sectors.

## Phase 6 - Reminders

1. Implement reminders and assignees as one cohesive feature.
2. Implement the exact reminder-visibility query for the current user and selected scope.
3. Implement sidebar CRUD, completion, multiple assignees and optional group association.
4. Map dated reminders into FullCalendar without duplicating persistence data.
5. Implement reminder click/edit and, if enabled for reminders, deadline drag-and-drop.

Exit condition: personal, created, assigned and group-scoped reminders follow the agreed visibility rules in both sidebar and calendar.

## Phase 7 - Objectives

1. Implement objective schemas, queries, mutations and status management.
2. Hide the panel in general view and load the selected recursive group scope otherwise.
3. Preselect the active group while allowing any active group in the hierarchy.
4. Implement create, edit and safe delete flows.

Exit condition: objectives can be associated with any active group and visibility remains consistent with recursive filters and RLS.

## Phase 8 - MVP hardening and production release

1. Complete cross-feature responsive behaviour, accessibility and Italian copy review.
2. Verify loading, empty, error and destructive-confirmation states for every flow.
3. Run unit, integration and critical end-to-end tests.
4. Review query plans, indexes, calendar-range queries and N+1 risks.
5. Perform an RLS/security review using direct API access tests.
6. Validate Vercel preview and production environment variables, redirects and build output.
7. Execute a production smoke test and document deployment and rollback procedures.

Exit condition: every item in the Definition of Done is verified in a production-like environment.

Do not start by building every UI component before the database model, authorization and filtering logic exist. Do not postpone responsive behaviour, accessibility, validation or error handling until Phase 8 when they belong to a feature implemented earlier.

---

# 64. Definition of Done

The first MVP can be considered complete when:

- an existing Supabase user can log in;
- an unauthenticated user cannot access the dashboard;
- sector access is respected;
- a user with both sectors can switch between them;
- groups can be represented as an arbitrary tree of nested subgroups;
- every active group can own work, reminders and objectives;
- the dashboard initially shows all work for the active sector;
- selecting a tree level filters to all descendant groups;
- FullCalendar displays scheduled work;
- scheduled work can be moved through drag-and-drop;
- the new date persists after refresh;
- reminders can have multiple assignees;
- reminders with deadlines appear in the calendar;
- reminder filtering behaves correctly;
- objectives remain hidden in general view;
- objectives appear when a group is selected;
- objectives include descendants of the selected node;
- all users with access to a sector can modify sector data;
- unauthorized sector data cannot be accessed through direct database/API requests;
- the dashboard remains usable on desktop, tablet and mobile;
- TypeScript passes without unsafe shortcuts;
- lint and production build complete successfully.
