import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import VerifyOtpPage from "./features/auth/pages/VerifyOtpPage";
import AuthLayout from "./features/auth/layouts/AuthLayout";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import VerifyOtpForgotPasswordPage from "./features/auth/pages/VerifyOtpForgotPassword";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";

function App() {
  return (
    <Routes>
      {/* Các trang xác thực dùng chung AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp-forgot-password" element={<VerifyOtpForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Home không sử dụng AuthLayout */}
      <Route path="/" element={<HomePage />} />

      {/* Đường dẫn không tồn tại sẽ quay về Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;