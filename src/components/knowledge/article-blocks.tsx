import { AlertTriangle, Info } from "lucide-react";
import type { Block } from "@/content/types";
import { cn } from "@/lib/utils";

/**
 * Block renderer.
 *
 * Each block kind gets markup that matches what it is. This is not decoration:
 * an answer engine extracting content relies on structure to decide what a
 * passage is for. A definition wrapped in a `<dl>`, steps in an ordered list
 * and a comparison in a real `<table>` are extractable. The same content as
 * undifferentiated paragraphs is not.
 */
export function ArticleBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case "answer":
      return (
        <section className="scroll-mt-28">
          <h2 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">
            {block.heading}
          </h2>
          {/*
            The lead answer sits immediately under the heading and is written to
            stand alone. Visually distinct so a scanning reader finds it, and
            first in the DOM so an extractor does.
          */}
          <p className="mt-5 border-l-2 border-lava-500 pl-5 text-[17px] font-medium leading-[1.7] text-foreground">
            {block.answer}
          </p>
          {block.paragraphs.map((p, i) => (
            <p
              key={i}
              className="mt-5 text-[17px] leading-[1.75] text-muted-foreground"
            >
              {p}
            </p>
          ))}
        </section>
      );

    case "prose":
      return (
        <section className="scroll-mt-28">
          <h2 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">
            {block.heading}
          </h2>
          {block.paragraphs.map((p, i) => (
            <p
              key={i}
              className="mt-5 text-[17px] leading-[1.75] text-muted-foreground"
            >
              {p}
            </p>
          ))}
        </section>
      );

    case "steps":
      return (
        <section className="scroll-mt-28">
          <h2 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">
            {block.heading}
          </h2>
          {block.intro ? (
            <p className="mt-5 text-[17px] leading-[1.75] text-muted-foreground">
              {block.intro}
            </p>
          ) : null}
          <ol className="mt-7 space-y-6">
            {block.steps.map((step, i) => (
              <li key={step.name} className="flex gap-5">
                <span className="tabular mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[13px] font-medium">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[17px] font-semibold tracking-tight">
                    {step.name}
                  </h3>
                  <p className="mt-1.5 text-[16px] leading-[1.7] text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      );

    case "table":
      return (
        <section className="scroll-mt-28">
          <h2 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">
            {block.heading}
          </h2>
          {block.intro ? (
            <p className="mt-5 text-[17px] leading-[1.75] text-muted-foreground">
              {block.intro}
            </p>
          ) : null}
          {/* Scrolls inside its own box so the page never scrolls sideways. */}
          <div className="mt-7 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {block.columns.map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="whitespace-nowrap px-5 py-3.5 text-[13px] font-semibold"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0"
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={cn(
                          "px-5 py-3.5 align-top leading-relaxed",
                          j === 0
                            ? "font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption ? (
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              {block.caption}
            </p>
          ) : null}
        </section>
      );

    case "callout": {
      const isWarning = block.tone === "warning";
      const Icon = isWarning ? AlertTriangle : Info;
      return (
        <aside
          className={cn(
            "rounded-2xl border p-6",
            isWarning
              ? "border-lava-300 bg-lava-50/60 dark:border-lava-900 dark:bg-lava-950/25"
              : "border-border bg-muted/45",
          )}
        >
          <div className="flex gap-4">
            <Icon
              className={cn(
                "mt-0.5 size-5 shrink-0",
                isWarning
                  ? "text-lava-600 dark:text-lava-400"
                  : "text-muted-foreground",
              )}
              aria-hidden
            />
            <div className="min-w-0">
              <h3 className="text-[17px] font-semibold tracking-tight">
                {block.heading}
              </h3>
              <p className="mt-2 text-[16px] leading-[1.7] text-muted-foreground">
                {block.body}
              </p>
            </div>
          </div>
        </aside>
      );
    }

    case "definition":
      return (
        <dl className="rounded-2xl border border-border p-6">
          <dt className="font-mono text-[15px] font-semibold tracking-tight text-lava-600 dark:text-lava-400">
            {block.term}
          </dt>
          <dd className="mt-3 text-[17px] font-medium leading-[1.7]">
            {block.definition}
          </dd>
          {block.expansion ? (
            <dd className="mt-4 text-[16px] leading-[1.7] text-muted-foreground">
              {block.expansion}
            </dd>
          ) : null}
        </dl>
      );
  }
}
