import { StrictMode } from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./styles.css";
import { AppProviders } from "./app/providers";
import { router } from "./router";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
