import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import RealtimeChatManager from "../features/chat/components/RealtimeChatManager";

export default function MainLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F3F2F7] text-social-ink flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        <Header />

        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <Outlet />
        </main>
      </div>

      <Footer />

      <RealtimeChatManager />
    </div>
  );
}
