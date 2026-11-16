import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

type Visit = { cookie?: string; acceptLanguage?: string };

function visit(path: string, { cookie, acceptLanguage }: Visit = {}) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  if (acceptLanguage) headers.set("accept-language", acceptLanguage);
  return proxy(new NextRequest(`http://localhost:3000${path}`, { headers }));
}

const redirectPath = (response: Response) => {
  const location = response.headers.get("location");
  return location && new URL(location).pathname + new URL(location).search;
};

describe("proxy", () => {
  describe("an address without a language, like the QR Code's", () => {
    it("goes to the phone's language on a first visit", () => {
      const response = visit("/joao-maria", { acceptLanguage: "en-US,en" });
      expect(response.status).toBe(307);
      expect(redirectPath(response)).toBe("/en/joao-maria");
    });

    it("goes to the language chosen before, over the phone's", () => {
      const response = visit("/joao-maria", {
        cookie: "NEXT_LOCALE=en",
        acceptLanguage: "pt-BR",
      });
      expect(redirectPath(response)).toBe("/en/joao-maria");
    });

    it("ignores a saved language the app doesn't have", () => {
      const response = visit("/joao-maria", {
        cookie: "NEXT_LOCALE=fr",
        acceptLanguage: "en",
      });
      expect(redirectPath(response)).toBe("/en/joao-maria");
    });

    it("keeps the query string, and the home page has no trailing slash", () => {
      expect(redirectPath(visit("/joao-maria?from=qr"))).toBe(
        "/pt-BR/joao-maria?from=qr",
      );
      expect(redirectPath(visit("/"))).toBe("/pt-BR");
    });

    // An event's slug can start like a language.
    it("doesn't take /enxoval for an English page", () => {
      expect(redirectPath(visit("/enxoval"))).toBe("/pt-BR/enxoval");
    });
  });

  describe("an address with a language", () => {
    it("is served, and its language is remembered", () => {
      const response = visit("/en/joao-maria", { cookie: "NEXT_LOCALE=pt-BR" });
      expect(response.headers.get("location")).toBeNull();
      expect(response.cookies.get("NEXT_LOCALE")?.value).toBe("en");
    });

    it("doesn't rewrite a cookie that is already right", () => {
      const response = visit("/en/joao-maria", { cookie: "NEXT_LOCALE=en" });
      expect(response.cookies.get("NEXT_LOCALE")).toBeUndefined();
    });
  });
});
