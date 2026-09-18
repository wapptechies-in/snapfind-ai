import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import ComingSoon from "./pages/ComingSoon";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/events" element={<Events />} />
      <Route path="/photos" element={<ComingSoon title="Photos" />} />
      <Route path="/processing" element={<ComingSoon title="Processing" />} />
      <Route path="/qr-codes" element={<ComingSoon title="QR Codes" />} />
      <Route path="/settings" element={<ComingSoon title="Settings" />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
