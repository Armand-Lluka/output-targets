/**
 * Reproduction page for the resolveType bug in scoped SSR mode.
 *
 * Bug: resolveType in packages/react/src/runtime/ssr.tsx does not handle exotic
 * component types (React.forwardRef, React.memo) or already-rendered ReactElements
 * from async Stencil SSR children when they appear as named-slot children of a
 * scoped Stencil SSR component.
 *
 * How to observe the bug (view page source or disable JS):
 *
 * Case 1 — React.forwardRef child:
 *   The <my-button-scoped> with a forwardRef icon child should contain
 *   a <span data-icon> in its SSR output. Instead the slot child is silently
 *   dropped — resolveType returns null for an exotic forwardRef object.
 *
 * Case 2 — React.memo child:
 *   Same as Case 1 but with React.memo. The slot child is dropped.
 *
 * Case 3 — Nested Stencil SSR component as named-slot child:
 *   A <my-component-scoped> passed into the start slot of <my-button-scoped>
 *   should render its full hydrated output. Instead, the already-rendered
 *   ReactElement is recursively unwrapped back to a bare tag name, and the
 *   hydrateModule-rendered innerHTML is lost — the slot child appears as an
 *   empty unhydrated element.
 *
 * All three bugs are scoped-mode only. The DSD (shadow) equivalents below
 * render correctly because resolveType is never called on exotic types in that path.
 */
import React from 'react';
import { MyButton, MyButtonScoped, MyComponent, MyComponentScoped } from 'component-library-react/next';

// Minimal React.forwardRef wrapper — mimics what @lit/react produces for a web component.
// resolveType on main: typeof ForwardRefIcon === 'object', hits no branch → returns null → dropped.
const ForwardRefIcon = React.forwardRef<HTMLSpanElement, { slot?: string }>(function ForwardRefIcon(
  { slot },
  ref
) {
  return (
    <span data-icon ref={ref} slot={slot} aria-hidden="true">
      ★
    </span>
  );
});

// Minimal React.memo wrapper.
// resolveType on main: typeof MemoIcon === 'object', hits no branch → returns null → dropped.
const MemoIcon = React.memo(function MemoIcon({ slot }: { slot?: string }) {
  return (
    <span data-icon slot={slot} aria-hidden="true">
      ★
    </span>
  );
});

export default function ResolveTypeRepro() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', fontFamily: 'sans-serif' }}>
      <h1>resolveType Bug Reproduction (scoped SSR)</h1>
      <p>
        <strong>View page source</strong> or disable JS to observe the SSR output.
        Each &ldquo;Broken&rdquo; case should show the slot child in the server-rendered HTML but does not.
        The &ldquo;Working&rdquo; (DSD / shadow) equivalents render correctly for comparison.
      </p>

      <hr />

      {/* ── Case 1: React.forwardRef ── */}
      <section>
        <h2>Case 1 — React.forwardRef slot child</h2>
        <p>
          <strong>Broken (scoped):</strong> the <code>ForwardRefIcon</code> in the{' '}
          <code>start</code> slot is silently dropped from the SSR output.
        </p>
        <MyButtonScoped>
          <ForwardRefIcon slot="start" />
          Scoped button — forwardRef start icon
        </MyButtonScoped>

        <p>
          <strong>Working (shadow/DSD):</strong> plain HTML in a shadow slot renders fine.
        </p>
        <MyButton>
          <span slot="start" data-icon aria-hidden="true">★</span>
          Shadow button — plain start icon
        </MyButton>
      </section>

      <hr />

      {/* ── Case 2: React.memo ── */}
      <section>
        <h2>Case 2 — React.memo slot child</h2>
        <p>
          <strong>Broken (scoped):</strong> the <code>MemoIcon</code> in the{' '}
          <code>start</code> slot is silently dropped from the SSR output.
        </p>
        <MyButtonScoped>
          <MemoIcon slot="start" />
          Scoped button — memo start icon
        </MyButtonScoped>

        <p>
          <strong>Working (shadow/DSD):</strong> plain HTML in a shadow slot renders fine.
        </p>
        <MyButton>
          <span slot="start" data-icon aria-hidden="true">★</span>
          Shadow button — plain start icon
        </MyButton>
      </section>

      <hr />

      {/* ── Case 3: Nested Stencil SSR component ── */}
      <section>
        <h2>Case 3 — Nested Stencil SSR component as named-slot child</h2>
        <p>
          <strong>Broken (scoped):</strong> <code>MyComponentScoped</code> in the{' '}
          <code>start</code> slot should include its hydrateModule-rendered innerHTML.
          Instead the slot child is rendered as a bare, unhydrated element.
        </p>
        <MyButtonScoped>
          <MyComponentScoped slot="start" first="Icon" last="Scoped">★</MyComponentScoped>
          Scoped button — scoped Stencil SSR start child
        </MyButtonScoped>

        <p>
          <strong>Working (shadow/DSD):</strong> <code>MyComponent</code> in the{' '}
          <code>start</code> slot of a shadow component renders with full hydration.
        </p>
        <MyButton>
          <MyComponent slot="start" first="Icon" last="Shadow">★</MyComponent>
          Shadow button — shadow Stencil SSR start child
        </MyButton>
      </section>
    </main>
  );
}
