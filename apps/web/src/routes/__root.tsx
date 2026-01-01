import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@/components/shadcn/sonner";
import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

// biome-ignore lint/style/useConsistentTypeDefinitions: we need to use an empty object for the context
// biome-ignore lint/complexity/noBannedTypes: we need to use an empty object for the context
export type RouterAppContext = {};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Sonar",
      },
      {
        name: "description",
        content:
          "A modern IPTV streaming application built with Tauri and React",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/sonar.svg",
        type: "image/svg+xml",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <Outlet />
        <Toaster richColors />
      </ThemeProvider>
      <ReactQueryDevtools buttonPosition="bottom-right" />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
