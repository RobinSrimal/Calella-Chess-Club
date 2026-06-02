# Table: audit_events

## Purpose

Records important administrative and security-relevant actions.

## Columns

```txt
id
actor_id
action
target_type
target_id
metadata_json
created_at
```

## Actions

```txt
membership approved
membership rejected
membership restored
account disabled
post made public
post made member-only
post deleted
event made public
event made member-only
event deleted
password reset completed
refresh sessions revoked
```
