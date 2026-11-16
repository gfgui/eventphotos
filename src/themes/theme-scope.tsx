"use client";

import { type CSSProperties, type ReactNode, useEffect } from "react";
import {
  type HeadingFontId,
  headingFontValue,
  type ThemeId,
} from "@/themes/config";

type Props = {
  theme: ThemeId;
  headingFont: HeadingFontId;
  children: ReactNode;
};

/**
 * Applies an event's theme: its CSS variables cascade from the data-theme attribute. A title
 * font chosen by the hosts replaces the theme's --heading-font. Dialogs and menus render in a
 * portal under <body>, outside this element, so both are mirrored there.
 */
export function ThemeScope({ theme, headingFont, children }: Props) {
  const font = headingFontValue(headingFont);

  useEffect(() => {
    const { body } = document;
    body.dataset.theme = theme;
    if (font) body.style.setProperty("--heading-font", font);
    return () => {
      delete body.dataset.theme;
      body.style.removeProperty("--heading-font");
    };
  }, [theme, font]);

  return (
    <div
      data-slot="theme-scope"
      data-theme={theme}
      style={font ? ({ "--heading-font": font } as CSSProperties) : undefined}
      className="flex flex-1 flex-col bg-background font-sans text-foreground"
    >
      {children}
    </div>
  );
}
