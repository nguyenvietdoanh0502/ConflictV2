import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Header />

      <Outlet />

      <Footer />
    </div>
  );
}