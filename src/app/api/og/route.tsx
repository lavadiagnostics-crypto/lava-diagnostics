import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/**
 * Open Graph card generator.
 *
 * Rendered on demand at the edge rather than committed as static PNGs, so every
 * one of the knowledge-centre articles gets a correct card without anybody
 * maintaining an image per page.
 *
 * Deliberately typographic. A social card is read at thumbnail size in a feed,
 * where a photograph becomes mud and a headline set large stays legible.
 */

export const runtime = "edge";

const BRAND_ORANGE = "#FF5B2E";
const CHARCOAL = "#141414";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Clamped so an over-long title cannot overflow the canvas.
  const title = (searchParams.get("title") ?? "Independent Third-Party Testing")
    .slice(0, 110);
  const eyebrow = (searchParams.get("eyebrow") ?? "LAVA Diagnostics").slice(
    0,
    48,
  );
  const meta = searchParams.get("meta")?.slice(0, 60) ?? "";

  // Long headlines step down a size rather than wrapping to four lines.
  const titleSize = title.length > 78 ? 54 : title.length > 48 ? 64 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CHARCOAL,
          padding: "72px",
          position: "relative",
        }}
      >
        {/* Brand edge. Reads as a colour bar at thumbnail scale. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: BRAND_ORANGE,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: BRAND_ORANGE,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 27,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              LAVA Diagnostics
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginTop: 6,
              }}
            >
              Independent Laboratory
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? (
            <div
              style={{
                fontSize: 19,
                color: BRAND_ORANGE,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                marginBottom: 22,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 600,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              maxWidth: 980,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 26,
          }}
        >
          <div style={{ fontSize: 21, color: "rgba(255,255,255,0.6)" }}>
            lavadiagnostics.com
          </div>
          {meta ? (
            <div style={{ fontSize: 21, color: "rgba(255,255,255,0.4)" }}>
              {meta}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
