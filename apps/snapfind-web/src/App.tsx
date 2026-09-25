import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import AccountStatus from "./pages/AccountStatus";

// Admin Pages
import AdminApprovals from "./pages/admin/AdminApprovals";

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
import Bookings from "./pages/Bookings";
import Subscription from "./pages/Subscription";
import Analytics from "./pages/Analytics";

// Customer Public Pages
import EventLanding from "./pages/public/EventLanding";
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/account-status" element={<AccountStatus />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

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
          path="/bookings"
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
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

        {/* Studio Settings & Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          }
        />
        <Route path="/billing" element={<Navigate to="/subscription" replace />} />
        <Route path="/upload" element={<Navigate to="/events" replace />} />
        <Route path="/processing" element={<Navigate to="/events" replace />} />

        {/* Administration */}
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute>
              <AdminApprovals />
            </ProtectedRoute>
          }
        />

        {/* Customer Public Gallery Routes (Accessed via QR / Token) */}
        <Route path="/event/:token" element={<EventLanding />} />
        <Route path="/event/:token/gallery" element={<CustomerGallery />} />
        <Route path="/event/:token/search" element={<FindMyPhotos />} />
        <Route path="/event/:token/results" element={<SearchResults />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
