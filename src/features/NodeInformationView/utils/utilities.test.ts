import { describe, expect, it } from "vitest";
import {
  getAnnotationSectionHeading,
  getAnnotationSourceLabel,
  getBiolinkSource,
  OBJECT_TYPE_SECTION_KEY,
  sortAnnotationFields,
} from "./utilities";

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

  it("prefers the section's sourceLabel override over the backend name", () => {
    const overrides = { "gene.tdl": { sourceLabel: "Custom label" } };
    expect(getAnnotationSourceLabel({ id: "tdl", name: "Pharos", url: "https://opendata.ncats.nih.gov/" }, "gene.tdl", overrides))
      .toBe("Custom label");
  });

  it("ignores overrides for other sections", () => {
    const overrides = { "gene.tdl": { sourceLabel: "Custom label" } };
    expect(getAnnotationSourceLabel({ id: "chembl", name: "ChEMBL", url: "https://www.ebi.ac.uk/chembl/" }, "chemical.approval", overrides))
      .toBe("Learn more on ChEMBL");
  });

  it("uses the default label when no section key is given", () => {
    expect(getAnnotationSourceLabel({ id: "tdl", name: "Pharos", url: "https://opendata.ncats.nih.gov/" }))
      .toBe("Learn more on Pharos");
  });

  it("labels the tdl section's source with the shipped override", () => {
    expect(getAnnotationSourceLabel({ id: "tdl", name: "Pharos", url: "https://opendata.ncats.nih.gov/" }, "gene.tdl"))
      .toBe("Learn more about Target Development Levels");
  });

  it("labels the frontend-built biolink source with the shipped override", () => {
    expect(getAnnotationSourceLabel(getBiolinkSource("https://biolink.github.io/biolink-model/Gene"), OBJECT_TYPE_SECTION_KEY))
      .toBe("Learn more about the Biolink Model");
  });
});

describe("getAnnotationSectionHeading", () => {
  it("generates a heading from the backend key", () => {
    expect(getAnnotationSectionHeading("chemical.clinical_trials", "clinical_trials", {})).toBe("Clinical Trials");
  });

  it("prefers the section's heading override", () => {
    const overrides = { "gene.tdl": { heading: "Custom heading" } };
    expect(getAnnotationSectionHeading("gene.tdl", "tdl", overrides)).toBe("Custom heading");
  });

  it("falls back to the generated heading when the section override has no heading", () => {
    const overrides = { "gene.tdl": { sourceLabel: "Custom label" } };
    expect(getAnnotationSectionHeading("gene.tdl", "tdl", overrides)).toBe("Tdl");
  });

  it("ships acronym headings for otc_status, curies, and tdl", () => {
    expect(getAnnotationSectionHeading("chemical.otc_status", "otc_status")).toBe("OTC Status");
    expect(getAnnotationSectionHeading("disease.curies", "curies")).toBe("CURIEs");
    expect(getAnnotationSectionHeading("gene.tdl", "tdl")).toBe("TDL");
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
