import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ConnectedToastContainer } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/Toaster";
import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import EnvironmentValidator from "@/components/EnvironmentValidator";
import RouteGuard from "@/components/RouteGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <div className={inter.variable}>
      <EnvironmentValidator>
        <SessionProvider session={session}>
          <ThemeProvider defaultTheme="light" storageKey="ui-theme">
            <AuthProvider>
              <ToastProvider>
                <RouteGuard>
                  <Component {...pageProps} />
                </RouteGuard>
                <ConnectedToastContainer />
                <Toaster richColors position="top-right" />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </SessionProvider>
      </EnvironmentValidator>
    </div>
  );
}
