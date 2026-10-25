import { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Smartphone,
  Radio,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bot,
  UserCheck,
  Sparkles,
  Zap,
  ShieldCheck,
  Layers,
  ArrowRight,
  Shield,
  Clock
} from "lucide-react";
import {
  fetchBridgeStatus,
  switchBridgeMode,
  generateBridgeQr,
  logoutBridge,
  refreshBridgeGroups,
} from "../services/zaloBridgeApi";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

export default function ZaloConnectPanel({ onNavigateToWhitelist, onNavigateToSimulator }) {
  const [status, setStatus] = useState(null);
  const [isBridgeOnline, setIsBridgeOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isQrRefreshing, setIsQrRefreshing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pollingRef = useRef(null);

  // Load status on mount
  const loadStatus = async () => {
    const data = await fetchBridgeStatus();
    if (data) {
      setStatus(data);
      setIsBridgeOnline(true);
    } else {
      setIsBridgeOnline(false);
    }
  };

  useEffect(() => {
    loadStatus();

    // Auto-switch to real mode on mount so student connects real Zalo
    fetchBridgeStatus().then((st) => {
      if (st && st.mode === "mock") {
        switchBridgeMode("real").then((updated) => {
          if (updated) setStatus(updated);
        }).catch(() => {});
      }
    });

    // Poll status periodically (every 2 seconds)
    pollingRef.current = setInterval(async () => {
      const data = await fetchBridgeStatus();
      if (data) {
        setStatus(data);
        setIsBridgeOnline(true);
      } else {
        setIsBridgeOnline(false);
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleGenerateQr = async () => {
    setIsQrRefreshing(true);
    setActionError("");
    try {
      const updated = await generateBridgeQr();
      setStatus(updated);
    } catch (err) {
      setActionError(err.message || "Không thể tạo mã QR mới");
    } finally {
      setIsQrRefreshing(false);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoading(true);
    setActionError("");
    try {
      const updated = await logoutBridge();
      setStatus(updated);
      setShowLogoutConfirm(false);
    } catch (err) {
      setActionError(err.message || "Lỗi khi đăng xuất Zalo");
    } finally {
      setIsLoading(false);
    }
  };

  const isRealConnected = Boolean(status?.connected && status?.mode === "real");

  return (
    <div className="space-y-6">
      {/* Bridge Offline Alert */}
      {!isBridgeOnline && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 text-xs sm:text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-amber-900">
              Dịch vụ Zalo Bridge (Cổng 3001) chưa phản hồi
            </p>
            <p className="text-amber-700 leading-relaxed font-medium">
              Vui lòng đảm bảo tiến trình Zalo Bridge đang chạy trên máy tính bằng lệnh:
              <code className="mx-1.5 px-2 py-0.5 bg-amber-100/80 rounded-lg font-mono font-bold text-amber-900">
                cd zalo-bridge && npm start
              </code>
            </p>
            <button
              onClick={loadStatus}
              className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900 underline mt-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Kiểm tra lại kết nối
            </button>
          </div>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs sm:text-sm text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="font-bold">{actionError}</span>
          </div>
          <button
            onClick={() => setActionError("")}
            className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-100/60 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <QrCode className="w-5 h-5" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900">
              Kết nối tài khoản Zalo cá nhân
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Quét mã QR bằng ứng dụng Zalo trên điện thoại để đồng bộ danh sách nhóm lớp và tự động nhận diện lịch học.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border ${
              isRealConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100"
                : "bg-purple-50 text-purple-700 border-purple-200"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isRealConnected ? "bg-emerald-500 animate-pulse" : "bg-purple-500"}`} />
            {isRealConnected ? "Tài khoản đang kết nối" : "Chờ quét mã QR"}
          </span>
        </div>
      </div>

      {/* Main Content Area - Dạng chữ nhật ngang rộng rãi */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
        {isRealConnected ? (
          /* TRẠNG THÁI ĐÃ KẾT NỐI - BỐ CỤC NGANG 2 CỘT RỘNG */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Cột trái: Thẻ User Profile Zalo */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 border border-indigo-100/90 shadow-sm space-y-5">
              <div className="flex items-center gap-4">
                {status?.user?.avatar ? (
                  <img
                    src={status.user.avatar}
                    alt={status.user.displayName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-indigo-200 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-purple-100 text-purple-700 grid place-items-center shadow-inner">
                    <UserCheck className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base sm:text-lg font-black text-slate-900 truncate">
                      {status?.user?.displayName || "Tài khoản Zalo"}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                    ID: {status?.user?.userId || "N/A"}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đang hoạt động
                  </div>
                </div>
              </div>

              {/* Thông số nhóm */}
              <div className="p-4 rounded-2xl bg-white/90 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500">Số nhóm Zalo đã đồng bộ:</span>
                  <div className="text-xl font-black text-indigo-900 mt-0.5">
                    {status?.groupCount || 0} <span className="text-xs font-bold text-slate-500">nhóm</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={refreshBridgeGroups}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer shadow-sm"
                  title="Đồng bộ lại danh sách nhóm từ Zalo"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
                </button>
              </div>

              {/* Nút Đăng xuất */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-bold transition cursor-pointer"
                title="Đăng xuất khỏi tài khoản Zalo"
              >
                <LogOut className="w-4 h-4" />
                <span>Ngắt kết nối tài khoản Zalo này</span>
              </button>
            </div>

            {/* Cột phải: Trạng thái Listener & Hành động liên kết Whitelist */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Alert Realtime Listener */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200/90 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-sm sm:text-base font-black text-emerald-950">
                      Zalo Listener (Bộ lắng nghe thời gian thực) đang chạy!
                    </h5>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      Sẵn sàng nhận diện mọi tin nhắn từ nhóm lớp học
                    </p>
                  </div>
                </div>
              </div>

              {/* Action shortcut to Whitelist */}
              <div className="p-6 rounded-3xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs sm:text-sm font-black text-slate-900">
                    Bước tiếp theo: Ghép nhóm Zalo vào Môn học
                  </h5>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Chọn nhóm lớp tương ứng với từng môn học để AI bắt đầu lọc tin nhắn
                  </p>
                </div>

                {onNavigateToWhitelist && (
                  <button
                    type="button"
                    onClick={onNavigateToWhitelist}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-500/25 transition cursor-pointer shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Mở Whitelist để ghép môn</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>
        ) : (
          /* TRẠNG THÁI QUÉT MÃ QR - BỐ CỤC NGANG 2 CỘT RỘNG RÃI */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Cột trái (Lg: 7 cột): Hướng dẫn 3 bước & Lợi ích */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                  Đăng nhập Zalo bằng mã QR
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Đồng bộ tài khoản nhanh chóng chỉ trong 5 giây mà không cần nhập mật khẩu
                </p>
              </div>

              {/* 3 Bước hướng dẫn to rõ */}
              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Mở ứng dụng Zalo trên điện thoại
                    </h5>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Khởi chạy app Zalo cá nhân mà bạn dùng để tham gia các nhóm lớp học đại học.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Chọn biểu tượng Quét mã QR
                    </h5>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Bấm vào biểu tượng <strong>[–] (Quét QR)</strong> ở góc trên bên phải thanh tìm kiếm Zalo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Hướng camera vào màn hình & Bấm "Đăng nhập"
                    </h5>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Quét mã QR bên cạnh và xác nhận đăng nhập trên điện thoại của bạn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bảo mật & Tính năng */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900 font-medium">
                <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>
                  Phiên kết nối được mã hóa an toàn cục bộ trên máy tính. Hệ thống chỉ đọc tin nhắn từ các nhóm bạn cho phép trong Whitelist.
                </span>
              </div>
            </div>

            {/* Cột phải (Lg: 5 cột): Khung QR Code to bản sang trọng */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-50 to-indigo-50/30 border border-slate-200 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                
                {status?.qrStatus === "generating" ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-xs sm:text-sm text-slate-500">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-extrabold text-slate-700">Đang tạo mã QR từ máy chủ Zalo...</span>
                  </div>
                ) : status?.qrStatus === "scanned" ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center animate-in zoom-in duration-300">
                    {status?.scannedUser?.avatar ? (
                      <img
                        src={status.scannedUser.avatar}
                        alt="Scanned User"
                        className="w-20 h-20 rounded-full border-4 border-emerald-500 shadow-xl animate-bounce"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                    )}
                    <div>
                      <p className="text-base font-black text-emerald-800">
                        Đã quét mã thành công!
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold leading-relaxed">
                        Vui lòng bấm nút <strong>"Đăng nhập"</strong> trên điện thoại ({status?.scannedUser?.displayName})
                      </p>
                    </div>
                  </div>
                ) : status?.qrStatus === "expired" ? (
                  <div className="flex flex-col items-center gap-3.5 py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500" />
                    <div>
                      <p className="text-sm font-black text-slate-800">Mã QR đã hết hạn</p>
                      <p className="text-xs text-slate-500 mt-1">Bấm nút bên dưới để tạo mã QR mới</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateQr}
                      disabled={isQrRefreshing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-200 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isQrRefreshing ? "animate-spin" : ""}`} />
                      <span>Lấy mã QR mới</span>
                    </button>
                  </div>
                ) : status?.qrCode ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                      <img
                        src={status.qrCode}
                        alt="Zalo Login QR Code"
                        className="w-56 h-56 rounded-xl object-contain mx-auto"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-black text-indigo-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span>Chờ bạn quét trên điện thoại...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3.5 py-8 text-center">
                    <QrCode className="w-12 h-12 text-slate-400" />
                    <button
                      type="button"
                      onClick={handleGenerateQr}
                      disabled={isQrRefreshing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-200 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isQrRefreshing ? "animate-spin" : ""}`} />
                      <span>Tạo mã QR đăng nhập</span>
                    </button>
                  </div>
                )}

                {/* Nút Làm mới QR */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateQr}
                    disabled={isQrRefreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isQrRefreshing ? "animate-spin" : ""}`} />
                    <span>Làm mới mã QR</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoading}
        title="Xác nhận ngắt kết nối Zalo"
        description="Bạn có chắc chắn muốn đăng xuất tài khoản Zalo cá nhân? Phiên làm việc sẽ bị xóa và hệ thống sẽ dừng lắng nghe tin nhắn từ tài khoản này."
        itemName={status?.user?.displayName || "Tài khoản Zalo"}
        confirmText="Ngắt kết nối"
        cancelText="Giữ lại"
      />
    </div>
  );
}
