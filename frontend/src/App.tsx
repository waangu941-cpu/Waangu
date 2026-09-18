import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateSession from "./pages/CreateSession";
import JoinSession from "./pages/JoinSession";
import SessionRoom from "./pages/SessionRoom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-session" element={<CreateSession />} />
        <Route path="/join-session" element={<JoinSession />} />
        <Route path="/session/:id" element={<SessionRoom />} />
      </Routes>
    </BrowserRouter>
  );
}