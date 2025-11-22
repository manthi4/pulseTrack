# PulseTrack Project Knowledge & Research

This document contains research findings, best practices, and critical observations regarding the PulseTrack project's technology stack.

## 🚨 Critical Dependency Mismatch

**Issue**: The project currently lists `svelte: ^5.0.0` and `bits-ui: ^0.21.16` in `package.json`.
**Impact**: `bits-ui` version 0.x is **NOT compatible** with Svelte 5.
**Action Required**: You must upgrade `bits-ui` to version 1.0.0+ to work with Svelte 5.

### Bits UI v1 Migration Guide
When upgrading, be aware of these breaking changes:
- **`el` prop removed**: Use `ref` instead.
- **`asChild` removed**: Use the `child` snippet.
- **`let:` directives removed**: Data is now exposed via `children` or `child` snippets.
- **Transitions**: Native Svelte transitions on components are removed; use them within the `child` snippet.

## Svelte 5 Runes Overview

Svelte 5 introduces "Runes" for explicit reactivity, replacing the implicit `let` and `$:` syntax.

### Core Runes
- **`$state(initialValue)`**: Declares reactive state.
  ```javascript
  let count = $state(0);
  ```
- **`$derived(expression)`**: Derived state that updates automatically.
  ```javascript
  let double = $derived(count * 2);
  ```
- **`$effect(() => { ... })`**: Side effects (replaces `onMount`, `afterUpdate`, `$: ...`).
  ```javascript
  $effect(() => {
    console.log(count);
    return () => { /* cleanup */ };
  });
  ```
- **`$props()`**: Declares component props.
  ```javascript
  let { title, count = 0 } = $props();
  ```

### Best Practices
- Use `$state` for all mutable reactive variables.
- Use `$derived` for values that depend on other state; avoid side effects inside `$derived`.
- Use `$effect` sparingly, primarily for synchronization with external systems (DOM, APIs).

## Dexie.js Integration

The project uses `dexie` for IndexedDB management.

### Using `liveQuery` with Svelte 5
Dexie's `liveQuery` returns an Observable, which is compatible with Svelte's store contract.

**Pattern:**
You can use `liveQuery` directly in your components by treating it as a store (using the `$` prefix) or by bridging it to a rune if preferred.

```javascript
<script>
  import { liveQuery } from "dexie";
  import { db } from "./db";

  // liveQuery returns a store-compliant observable
  let friends = liveQuery(() => db.friends.toArray());
</script>

<ul>
  {#each $friends || [] as friend}
    <li>{friend.name}</li>
  {/each}
</ul>
```

**Note**: Since `liveQuery` is asynchronous, the value will be `undefined` initially. Always handle the loading state (e.g., `|| []` or an `{#if}`).

## Tailwind CSS & UI

- The project uses `tailwindcss` with `bits-ui`.
- Ensure `tailwind.config.ts` includes the necessary content paths for Svelte files.
- `clsx` and `tailwind-merge` are available for conditional class merging, which is essential when building reusable components.
