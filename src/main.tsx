import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to render application:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
        <h1 style="color: #ea384c;">Application Error</h1>
        <p>Sorry, the application failed to load properly.</p>
        <p>Error details: ${
          error instanceof Error ? error.message : String(error)
        }</p>
        <button onclick="window.location.reload()" style="background: #ea384c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
} else {
  console.error("Root element not found in the DOM");
}
