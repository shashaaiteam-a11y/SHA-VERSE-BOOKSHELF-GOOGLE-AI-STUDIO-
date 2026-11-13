import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MobileProvider } from "./contexts/MobileContext";
import ModuleErrorBoundary from "./components/ModuleErrorBoundary";
import { Suspense, lazy as reactLazy, ComponentType } from "react";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useIsMobile } from "./hooks/use-mobile";

// Wrap React.lazy to auto-recover from stale chunk errors
const lazy = <T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) =>
  reactLazy(() =>
    factory().catch((err) => {
      const msg = String(err?.message || err);
      const isChunkError =
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg) ||
        /ChunkLoadError/i.test(msg);
      if (isChunkError && typeof window !== "undefined") {
        const key = "__lv_chunk_reload__";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw err;
    }),
  );

// Bookshelf & Auth Pages
const Auth = lazy(() => import("./pages/Auth"));
const Bookshelf = lazy(() => import("./modules/bookshelf/pages/Bookshelf"));
const BookDetail = lazy(() => import("./modules/bookshelf/pages/BookDetail"));
const EditBook = lazy(() => import("./modules/bookshelf/pages/EditBook"));
const BookReader = lazy(() => import("./modules/bookshelf/pages/BookReader"));
const AuthorChannel = lazy(() => import("./modules/bookshelf/pages/AuthorChannel"));
const EditAuthorChannel = lazy(() => import("./modules/bookshelf/pages/EditAuthorChannel"));
const BookAnalyticsPage = lazy(() => import("./modules/bookshelf/pages/BookAnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OfflinePage = lazy(() => import("./pages/Offline"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center bg-background">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

const withSuspense = (Component: React.ComponentType) => (
  <ModuleErrorBoundary>
    <Suspense fallback={<RouteLoader />}>
      <Component />
    </Suspense>
  </ModuleErrorBoundary>
);

const ResponsiveSonner = () => {
  const isMobile = useIsMobile();
  return (
    <Sonner
      position={isMobile ? "bottom-center" : "top-center"}
      offset={isMobile ? "calc(56px + 12px + env(safe-area-inset-bottom))" : undefined}
    />
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ResponsiveSonner />
        <BrowserRouter>
          <AuthProvider>
            <MobileProvider>
              <div className="min-h-screen bg-background safe-left safe-right">
                <Routes>
                  {/* Auth */}
                  <Route path="/auth" element={withSuspense(Auth)} />
                  <Route path="/offline" element={withSuspense(OfflinePage)} />

                  {/* Bookshelf Core Ecosystem */}
                  <Route path="/" element={<ProtectedRoute>{withSuspense(Bookshelf)}</ProtectedRoute>} />
                  <Route path="/bookshelf" element={<ProtectedRoute>{withSuspense(Bookshelf)}</ProtectedRoute>} />
                  <Route
                    path="/bookshelf/book/:bookId"
                    element={<ProtectedRoute>{withSuspense(BookDetail)}</ProtectedRoute>}
                  />
                  <Route
                    path="/bookshelf/book/:bookId/analytics"
                    element={<ProtectedRoute>{withSuspense(BookAnalyticsPage)}</ProtectedRoute>}
                  />
                  <Route
                    path="/bookshelf/edit/:bookId"
                    element={<ProtectedRoute>{withSuspense(EditBook)}</ProtectedRoute>}
                  />
                  <Route
                    path="/bookshelf/read/:bookId"
                    element={<ProtectedRoute>{withSuspense(BookReader)}</ProtectedRoute>}
                  />
                  <Route
                    path="/bookshelf/channel/:channelId"
                    element={<ProtectedRoute>{withSuspense(AuthorChannel)}</ProtectedRoute>}
                  />
                  <Route
                    path="/bookshelf/channel/:channelId/analytics"
                    element={<ProtectedRoute>{withSuspense(AuthorChannel)}</ProtectedRoute>}
                  />
                  <Route
                    path="/bookshelf/channel/:channelId/edit"
                    element={<ProtectedRoute>{withSuspense(EditAuthorChannel)}</ProtectedRoute>}
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </MobileProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
