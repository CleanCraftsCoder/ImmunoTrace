import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { AuthProvider } from "./app/lib/auth";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        style: {
          borderRadius: '16px',
          fontFamily: 'inherit',
        },
      }}
    />
  </AuthProvider>
);