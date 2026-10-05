import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/home.css";
import "./styles/guide.css";
import "./styles/chat.css";
import "./styles/auth.css";
import "./styles/profile.css";
import "./styles/history.css";
import "./styles/announcements.css";
import "./styles/admin.css";
// Design system: tokens, fallback fonts, the primitives
// (ds-* classes only), the chrome (Phase 2b) and Home (Phase 3).
import "./styles/ds-tokens.css";
import "./styles/ds-fonts.css";
import "./styles/ds-primitives.css"; // Phase 3: Badge, Surface, Section, Button used by Home
import "./styles/ds-chrome.css";
import "./styles/ds-home.css"; // Phase 3: Home (hero, search, how it works, announcements, band, trust strip)
import "./styles/ds-directory.css"; // Phase 4: service directory (Home) and service detail
import "./styles/ds-guide.css"; // Phase 5: the guide page
import "./styles/ds-chat.css"; // Phase 6: the assistant (edge tab, panel, messages)
import "./styles/ds-announcements.css"; // Phase 7: the announcements list and detail pages
import "./styles/ds-account.css"; // Phase 8: login, register and the profile page
import "./styles/ds-admin.css"; // Phase 9: the admin list, the admin form and the admin gate

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
