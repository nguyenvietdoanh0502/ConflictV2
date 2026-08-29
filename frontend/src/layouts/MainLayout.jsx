import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function MainLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F3F2F7] text-social-ink">
      <Header />

      <div id="main-content" tabIndex={-1} className="min-h-[calc(100vh-4rem)] outline-none">
        <Outlet />
      </div>
    </div>
  );
}
