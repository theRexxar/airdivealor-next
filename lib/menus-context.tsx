"use client";

import { createContext, useContext, type ReactNode } from "react";
import { MENUS_DEFAULTS, type MenusContent } from "./cms/menus";

const Ctx = createContext<MenusContent>(MENUS_DEFAULTS);

/** Header and footer menus from the CMS, for every page under it. Without it, the built-in menus are used. */
export function MenusProvider({ value, children }: { value: MenusContent; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useMenus = () => useContext(Ctx);

/** Full links to other sites open in a new tab. */
export const isExternal = (href: string) => /^https?:\/\//i.test(href);
