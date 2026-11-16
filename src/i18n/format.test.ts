import { describe, expect, it } from "vitest";
import { format, formatEventDate, formatFileSize } from "@/i18n/format";

describe("format", () => {
  it("fills every placeholder", () => {
    expect(format("Passo {step} de {total}", { step: 2, total: 3 })).toBe(
      "Passo 2 de 3",
    );
  });

  it("leaves unknown placeholders as they are", () => {
    expect(format("{name} enviou {count}", { name: "Ana" })).toBe(
      "Ana enviou {count}",
    );
  });
});

describe("formatEventDate", () => {
  // Saved at midnight UTC: the day must not move whatever the server's time zone.
  const date = new Date("2027-02-04T00:00:00.000Z");

  it("writes the calendar day in each language", () => {
    expect(formatEventDate(date, "pt-BR")).toBe("4 de fevereiro de 2027");
    expect(formatEventDate(date, "en")).toBe("February 4, 2027");
  });
});

describe("formatFileSize", () => {
  it("uses megabytes, then gigabytes, with the language's decimal mark", () => {
    expect(formatFileSize(1_500_000, "pt-BR")).toMatch(/^1,5\sMB$/);
    expect(formatFileSize(1_500_000, "en")).toMatch(/^1\.5\sMB$/);
    expect(formatFileSize(2_500_000_000, "en")).toMatch(/^2\.5\sGB$/);
  });
});
