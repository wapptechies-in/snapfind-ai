import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  text?: "signin_with" | "signup_with" | "continue_with";
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  text = "continue_with",
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devEmail, setDevEmail] = useState("photographer@google.com");
  const [devName, setDevName] = useState("Alex Studio");

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.warn("Failed to load Google Identity Services SDK");
    };
    document.body.appendChild(script);

    return () => {
      // Keep script in document
    };
  }, [clientId]);

  useEffect(() => {
    if (!scriptLoaded || !clientId || !buttonRef.current || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.("Google sign in did not provide credentials.");
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_black",
        size: "large",
        width: "100%",
        text,
        shape: "rectangular",
      });
    } catch (err) {
      console.error("Error initializing Google Identity Services:", err);
    }
  }, [scriptLoaded, clientId, text, onSuccess, onError]);

  const handleDevGoogleLogin = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!devEmail.trim()) return;
    setShowDevModal(false);
    onSuccess(`dev-:${devEmail.trim()}:${devName.trim() || "Google User"}`);
  };

  // If a real client ID is configured and rendered, show the official Google button container
  if (clientId && scriptLoaded) {
    return <div ref={buttonRef} className="w-full flex justify-center min-h-[44px]" />;
  }

  // Fallback interactive button for development or when client ID is pending setup
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowDevModal(true)}
        className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.99] disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Dev Mode Simulation Modal rendered safely via React Portal outside of form */}
      {showDevModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowDevModal(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-[#0F1219] border border-white/15 p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🌐</span> Google OAuth Simulation
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDevModal(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Google Client ID is not yet defined in environment variables. Enter an email to test the Google sign-in and admin approval flow immediately:
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Google Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleDevGoogleLogin(e);
                    }}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Photographer / Studio Name
                  </label>
                  <input
                    type="text"
                    required
                    value={devName}
                    onChange={(e) => setDevName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleDevGoogleLogin(e);
                    }}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-violet"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDevModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevGoogleLogin()}
                    className="px-4 py-1.5 rounded-lg bg-violet hover:bg-violet-light text-xs font-semibold text-white shadow-md shadow-violet/20"
                  >
                    Simulate Google Sign In →
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
