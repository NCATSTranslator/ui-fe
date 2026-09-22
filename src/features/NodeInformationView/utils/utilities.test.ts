import { describe, expect, it } from "vitest";
import { getAnnotationSourceLabel, getBiolinkSource, sortAnnotationFields } from "./utilities";

describe("getAnnotationSourceLabel", () => {
  it("uses the backend-supplied name", () => {
    expect(getAnnotationSourceLabel({ id: "chembl", name: "ChEMBL", url: "https://www.ebi.ac.uk/chembl/compound_report_card/CHEMBL25/" }))
      .toBe("Learn more on ChEMBL");
  });

  it("falls back to the hostname when the name is missing", () => {
    expect(getAnnotationSourceLabel({ id: "new_source", url: "https://www.example.org/record/1" }))
      .toBe("Learn more on example.org");
  });

  it("treats an empty name as missing", () => {
    expect(getAnnotationSourceLabel({ id: "new_source", name: "", url: "https://example.org/" }))
      .toBe("Learn more on example.org");
  });

  it("falls back to the raw url when neither the name nor the url is usable", () => {
    expect(getAnnotationSourceLabel({ id: "new_source", url: "not a url" })).toBe("not a url");
  });

  it("prefers a frontend override for the source id over the backend name", () => {
    const overrides = { tdl: "Custom label" };
    expect(getAnnotationSourceLabel({ id: "tdl", name: "Pharos", url: "https://opendata.ncats.nih.gov/" }, overrides))
      .toBe("Custom label");
  });

  it("labels the frontend-built biolink source with the shipped override", () => {
    expect(getAnnotationSourceLabel(getBiolinkSource("https://biolink.github.io/biolink-model/Gene")))
      .toBe("Learn more about the Biolink Model");
  });

  it("labels the tdl source with the shipped override", () => {
    expect(getAnnotationSourceLabel({ id: "tdl", name: "Pharos", url: "https://opendata.ncats.nih.gov/" }))
      .toBe("Learn more about Target Development Levels");
  });

  it("ignores overrides for other source ids", () => {
    const overrides = { tdl: "Custom label" };
    expect(getAnnotationSourceLabel({ id: "chembl", name: "ChEMBL", url: "https://www.ebi.ac.uk/chembl/" }, overrides))
      .toBe("Learn more on ChEMBL");
  });
});

describe("sortAnnotationFields", () => {
  const field = (key: string) => ({ key });

  it("orders listed sections by their position in the order list", () => {
    const order = ["chemical.roles", "chemical.synonyms"];
    const sorted = sortAnnotationFields([field("chemical.synonyms"), field("chemical.roles")], order);
    expect(sorted.map(f => f.key)).toEqual(["chemical.roles", "chemical.synonyms"]);
  });

  it("places unlisted sections after listed ones, keeping their arrival order", () => {
    const order = ["chemical.roles"];
    const sorted = sortAnnotationFields(
      [field("chemical.new_b"), field("chemical.roles"), field("chemical.new_a")],
      order,
    );
    expect(sorted.map(f => f.key)).toEqual(["chemical.roles", "chemical.new_b", "chemical.new_a"]);
  });

  it("does not mutate the input", () => {
    const input = [field("b"), field("a")];
    sortAnnotationFields(input, ["a", "b"]);
    expect(input.map(f => f.key)).toEqual(["b", "a"]);
  });
});
