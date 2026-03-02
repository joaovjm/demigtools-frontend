import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Approuter from "./router";
import { UserProvider } from "./context/UserContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UserProvider>
      <Approuter />
    </UserProvider>
  </StrictMode>
);
