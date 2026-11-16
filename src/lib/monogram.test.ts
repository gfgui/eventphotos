import { describe, expect, it } from "vitest";
import { eventMonogram } from "@/lib/monogram";

describe("eventMonogram", () => {
  it("takes one letter from each of the two honorees", () => {
    expect(
      eventMonogram({
        name: "Casamento de Ana e Bruno",
        honorees: ["Ana", "Bruno"],
      }),
    ).toBe("AB");
  });

  it("takes the first and last names of a single honoree", () => {
    expect(
      eventMonogram({ name: "Formatura", honorees: ["maria clara"] }),
    ).toBe("MC");
    expect(eventMonogram({ name: "Aniversário", honorees: ["Léo"] })).toBe("L");
  });

  it("falls back to the event's name without honorees", () => {
    expect(eventMonogram({ name: "João & Maria", honorees: [] })).toBe("JM");
    expect(eventMonogram({ name: "Festa", honorees: ["  "] })).toBe("F");
  });
});
