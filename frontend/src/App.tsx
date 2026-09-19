import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./hooks/useToast";
import ToastContainer from "./components/ToastContainer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateSession from "./pages/CreateSession";
import JoinSession from "./pages/JoinSession";
import SessionRoom from "./pages/SessionRoom";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessPublicView from "./pages/BusinessPublicView";
import PlacesDirectory from "./pages/PlacesDirectory";
import ScanQR from "./pages/ScanQR";
import Settings from "./pages/Settings";
import LearnZsl from "./pages/LearnZsl";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EditBusiness from "./pages/EditBusiness";
import Privacy from "./pages/Privacy";
import AdminDashboard from "./pages/AdminDashboard";
import AdminZsl from "./pages/AdminZsl";
import AdminBusinesses from "./pages/AdminBusinesses";
import AdminUsers from "./pages/AdminUsers";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-session" element={<CreateSession />} />
          <Route path="/join-session" element={<JoinSession />} />
          <Route path="/session/:id" element={<SessionRoom />} />
          <Route path="/business/onboarding" element={<BusinessOnboarding />} />
          <Route path="/business/:id" element={<BusinessDashboard />} />
          <Route path="/b/:token" element={<BusinessPublicView />} />
          <Route path="/places" element={<PlacesDirectory />} />
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/learn-zsl" element={<LearnZsl />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/business/:id/edit" element={<EditBusiness />} />
          <Route path="/business/:id" element={<BusinessDashboard />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/zsl" element={<AdminZsl />} />
          <Route path="/admin/businesses" element={<AdminBusinesses />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </ToastProvider>
  );
}