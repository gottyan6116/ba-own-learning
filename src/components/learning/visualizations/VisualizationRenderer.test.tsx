import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VisualizationRenderer } from "./VisualizationRenderer";

describe("VisualizationRenderer", () => {
  it("renders the matching visualization for structured learning data", () => {
    const markup = renderToStaticMarkup(
      <VisualizationRenderer
        data={{ type: "summary", sections: [{ heading: "要点", body: "本文" }] }}
      />,
    );

    expect(markup).toContain("要点");
    expect(markup).toContain("本文");
  });
});
