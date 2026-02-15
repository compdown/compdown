# Syntax Actions v1 (Draft)

This document defines the v1 action model for timeline context.

## Goals

- Keep creation simple and implicit.
- Make modification and deletion explicit.
- Keep syntax predictable and repeatable.

## Core rule

- No verb means create/add.
- Verbs are required for mutation.

## v1 grammar

```yaml
_timeline:
  layers: [...]            # implicit add/create
  set:
    layers: [...]          # explicit update existing
  remove:
    layers: [...]          # explicit delete existing
```

## 1) Implicit add/create

```yaml
_timeline:
  layers:
    - name: Background
      type: solid
      color: 1a1a2e
    - name: Title
      type: text
      text: Hello World
```

Behavior:
- Creates new layers in the active composition timeline.
- Uses current creation behavior and layer schema.
- Errors if no active comp timeline.

## 2) Explicit set/update

```yaml
_timeline:
  set:
    layers:
      - name: Title
        transform:
          position: [960, 500]
          opacity: 85
```

Matching:
- v1 matcher: `name` (exact, case-sensitive).

Behavior:
- Finds one existing layer by `name`.
- Applies only provided fields (partial update/patch).
- Does not create missing layers.

Error behavior:
- 0 matches: error `Layer not found for set: "<name>"`.
- >1 matches: error `Multiple layers matched for set: "<name>"`.

## 3) Explicit remove/delete

```yaml
_timeline:
  remove:
    layers:
      - name: Temp Layer
      - name: Debug Guide
```

Matching:
- v1 matcher: `name` (exact, case-sensitive).

Behavior:
- Removes matched layers from active timeline.
- Processes each entry independently.

Error behavior:
- 0 matches: error `Layer not found for remove: "<name>"`.
- >1 matches: error `Multiple layers matched for remove: "<name>"`.

## Validation rules

- `_timeline.layers` remains optional.
- `_timeline.set.layers` optional.
- `_timeline.remove.layers` optional.
- At least one of `layers`, `set.layers`, `remove.layers` must be present when `_timeline` exists.
- Unknown keys under `_timeline`, `set`, or `remove` should fail validation.

## Non-goals for v1

- Selector DSL (`_selected`, `_comp`, predicate matching).
- Replace vs merge conflict modes.
- Batch transactional semantics across all actions.
- Reorder/move/rename verbs.

## Suggested execution order (single document)

1. `_timeline.layers` (create)
2. `_timeline.set.layers` (update)
3. `_timeline.remove.layers` (delete)

Rationale:
- Deterministic behavior in one pass.
- Allows create then update in the same document.
- Avoids updating layers that are then immediately removed.

## Migration note

Current supported syntax already covers `_timeline.layers`.
`set/remove` should be introduced without changing existing create behavior.
