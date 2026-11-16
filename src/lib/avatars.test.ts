import { describe, expect, it } from "vitest";
import { avatarRefs, isAvatarRef } from "@/lib/avatars";

describe("avatars", () => {
  it("has 16 avatars in each set", () => {
    expect(avatarRefs("casual")).toHaveLength(16);
    expect(avatarRefs("discreet").at(-1)).toBe("discreet/15");
  });

  // Guest.avatar comes from the browser, so only the bundled references may pass.
  it.each([
    ["casual/0", true],
    ["discreet/15", true],
    ["casual/16", false],
    ["casual/01", false],
    ["other/1", false],
    ["../casual/1", false],
    ["", false],
  ])("isAvatarRef(%j) is %s", (value, expected) => {
    expect(isAvatarRef(value)).toBe(expected);
  });
});
