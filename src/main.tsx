import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug info
console.log("=== DEBUG INFO ===");
console.log("1. Starting application");
console.log("2. Looking for root element");

const rootElement = document.getElementById("root");
console.log("3. Root element found:", !!rootElement);

// Add a loading indicator to the root element
if (rootElement) {
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #f9fafb;">
      <div style="text-align: center;">
        <h1 style="font-size: 1.5rem; font-weight: 700; color: #ea384c; margin-bottom: 1rem;">First Class Fleet</h1>
        <p style="color: #4b5563;">Loading application...</p>
      </div>
    </div>
  `;
}

if (rootElement) {
  console.log("4. Creating React root");
  try {
    const root = createRoot(rootElement);
    console.log("5. Rendering App component");
    root.render(<App />);
    console.log("6. App rendered successfully");
  } catch (error) {
    console.error("Failed to render application:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
        <h1 style="color: #ea384c;">Application Error</h1>
        <p>Sorry, the application failed to load properly.</p>
        <p>Error details: ${error instanceof Error ? error.message : String(error)}</p>
        <button onclick="window.location.reload()" style="background: #ea384c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
} else {
  console.error("Root element not found in the DOM");
}
