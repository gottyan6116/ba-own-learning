import { expect, it } from "vitest";
import { mindMapFromText } from "./text";
it("creates parent-child edges from indented text", () => { const map = mindMapFromText("市場\n  顧客\n競合", "戦略"); expect(map.nodes).toHaveLength(4); expect(map.edges.map((edge) => edge.source)).toEqual(["root", "text-0", "root"]); });
