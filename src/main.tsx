import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

// @ts-expect-error some thing wrong
import "./styles.css";
import reportWebVitals from "./reportWebVitals";

import App from "./App";
import { BlueskyAuthProvider } from "./providers/bluesky-provider";
import { Toaster } from "react-hot-toast";

import HypercertsListPage from "./ListingPage";
import React from "react";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <BlueskyAuthProvider>
        <Toaster />
        <Outlet />
        <TanStackRouterDevtools />
      </BlueskyAuthProvider>
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

// ✅ NEW: /hypercerts route
const hypercertsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listing",
  component: HypercertsListPage,
});

// Add both routes to the tree
const routeTree = rootRoute.addChildren([indexRoute, hypercertsRoute]);

const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}

reportWebVitals();
