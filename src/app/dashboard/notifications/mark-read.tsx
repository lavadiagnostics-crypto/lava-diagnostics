"use client";

import * as React from "react";

/**
 * Marks notifications read once, after the list has painted.
 *
 * Deliberately a client effect rather than a call inside the page's render: a
 * server component that mutated state during render would fire on prefetch,
 * on back-navigation, and twice in development's double-render.
 */
export function MarkReadOnMount({
  ids,
  action,
}: {
  ids: string[];
  action: (ids: string[]) => Promise<void>;
}) {
  // Guards against React 18+ effects running twice in development.
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (fired.current || ids.length === 0) return;
    fired.current = true;

    void action(ids).catch((error) => {
      // Non-critical: the badge will simply still show a count.
      console.error("[notifications] could not mark as read", error);
    });
  }, [ids, action]);

  return null;
}
