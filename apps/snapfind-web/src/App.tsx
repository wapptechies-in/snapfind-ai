import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Photographer Dashboard Pages
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import CreateEvent from "./pages/events/CreateEvent";
import EventDetails from "./pages/events/EventDetails";
import EventPhotos from "./pages/events/EventPhotos";
import EventProcessing from "./pages/events/EventProcessing";
import EventQR from "./pages/events/EventQR";
import EventSettings from "./pages/events/EventSettings";
import Profile from "./pages/Profile";
import ComingSoon from "./pages/ComingSoon";

// Customer Public Pages
import CustomerGallery from "./pages/public/CustomerGallery";
import FindMyPhotos from "./pages/public/FindMyPhotos";
import SearchResults from "./pages/public/SearchResults";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Default route redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Photographer Dashboard (Private) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/create"
          element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/photos"
          element={
            <ProtectedRoute>
              <EventPhotos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/processing"
          element={
            <ProtectedRoute>
              <EventProcessing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/qr"
          element={
            <ProtectedRoute>
              <EventQR />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/settings"
          element={
            <ProtectedRoute>
              <EventSettings />
            </ProtectedRoute>
          }
        />

        {/* Photographer Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Generic global routes */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ComingSoon title="Global Settings" />
            </ProtectedRoute>
          }
        />

        {/* Customer Public Gallery Routes (Accessed via QR / Token) */}
        <Route path="/event/:token" element={<CustomerGallery />} />
        <Route path="/event/:token/search" element={<FindMyPhotos />} />
        <Route path="/event/:token/results" element={<SearchResults />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
