/**
 * Renders a Schema.org graph into the document.
 *
 * Server component by design: the payload must exist in the initial HTML.
 * Crawlers and answer engines that do not execute JavaScript see nothing if
 * this is injected client-side, which defeats the point.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own typed helpers, never from user input,
      // so there is no injection surface here. JSON.stringify also escapes the
      // sequences that would otherwise close the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
