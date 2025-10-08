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
import EmailLogin from "./EmailLogin";
import CertsEmailList from "./ListingPageATP";
import SignupPage from "./SignupPage";

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

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
});

const emailLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/email-login",
  component: EmailLogin,
});

const listingViaEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listing-via-email",
  component: CertsEmailList,
});

// Add both routes to the tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  hypercertsRoute,
  emailLoginRoute,
  listingViaEmailRoute,
  signupRoute,
]);

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
