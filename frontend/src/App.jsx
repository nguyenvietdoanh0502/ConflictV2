import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import VerifyOtpPage from "./features/auth/pages/VerifyOtpPage";
import AuthLayout from "./features/auth/layouts/AuthLayout";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import VerifyOtpForgotPasswordPage from "./features/auth/pages/VerifyOtpForgotPassword";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import ProfilePage from "./features/profile/pages/ProfilePage";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
import FriendsPage from "./features/friend/pages/FriendsPage";

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp-forgot-password" element={<VerifyOtpForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>
      <Route element={<MainLayout/>}>
        <Route path="/" element={<HomePage/>} />
        <Route element = {<ProtectedRoute/>}>
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/profile/friends" element={<Navigate to="/friends" replace />} />
          <Route path="/profile" element={<ProfilePage/>}>
            <Route path="favorites" element={null} />
            <Route path="history" element={null} />
            <Route path="*" element={<Navigate to="/profile" replace />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
