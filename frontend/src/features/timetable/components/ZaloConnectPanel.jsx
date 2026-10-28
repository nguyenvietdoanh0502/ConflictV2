import { useState, useEffect } from "react";
import {
  QrCode,
  Smartphone,
  Radio,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Bot,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
} from "lucide-react";
import {
  useGetBridgeStatusQuery,
  useGenerateBridgeQrMutation,
  useLogoutBridgeMutation,
  useRefreshBridgeGroupsMutation,
} from "../services/zaloBridgeApi";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

export default function ZaloConnectPanel({ onNavigateToWhitelist, onNavigateToSimulator }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [actionError, setActionError] = useState("");

  // RTK Query — poll status mỗi 2 giây
  const {
    data: status,
    isError: isBridgeError,
    refetch: refetchStatus,
  } = useGetBridgeStatusQuery(undefined, {
    pollingInterval: 2000,
  });

  const [generateQr, { isLoading: isQrGenerating }] = useGenerateBridgeQrMutation();
  const [logoutBridge, { isLoading: isLoggingOut }] = useLogoutBridgeMutation();
  const [refreshGroups] = useRefreshBridgeGroupsMutation();

  // Nếu bridge error thì hiện UI offline
  const isBridgeOnline = !isBridgeError && status !== undefined;
  const isRealConnected = Boolean(status?.connected);

  const handleGenerateQr = async () => {
    setActionError("");
    try {
      await generateQr().unwrap();
    } catch (err) {
      setActionError(err?.data?.message || "Không thể tạo mã QR mới. Vui lòng thử lại.");
    }
  };

  const handleConfirmLogout = async () => {
    setActionError("");
    try {
      await logoutBridge().unwrap();
      setShowLogoutConfirm(false);
    } catch (err) {
      setActionError(err?.data?.message || "Lỗi khi đăng xuất Zalo.");
    }
  };

  const handleRefreshGroups = async () => {
    try {
      await refreshGroups().unwrap();
    } catch (err) {
      setActionError("Không thể làm mới danh sách nhóm.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Bridge Offline Alert */}
      {!isBridgeOnline && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 text-xs sm:text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-amber-900">
              Dịch vụ kết nối Zalo đang tạm thời không phản hồi
            </p>
            <p className="text-amber-700 leading-relaxed font-medium">
              Hệ thống chưa thể kết nối đến cổng Zalo Bridge. Vui lòng thử lại sau ít phút.
            </p>
            <button
              onClick={refetchStatus}
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

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
        {isRealConnected ? (
          /* TRẠNG THÁI ĐÃ KẾT NỐI */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Cột trái: User Profile Zalo */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#F8F7FC] border border-indigo-100/90 shadow-sm space-y-5">
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
                  onClick={handleRefreshGroups}
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

            {/* Cột phải: Trạng thái Listener & Hành động Whitelist */}
            <div className="lg:col-span-7 space-y-5">

              {/* Alert Realtime Listener */}
              <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200/90 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-sm sm:text-base font-black text-emerald-950">
                      Zalo Listener đang chạy!
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
          /* TRẠNG THÁI QUÉT MÃ QR */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Cột trái: Hướng dẫn 3 bước */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                  Đăng nhập Zalo bằng mã QR
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Đồng bộ tài khoản nhanh chóng chỉ trong 5 giây mà không cần nhập mật khẩu
                </p>
              </div>

              {/* 3 Bước hướng dẫn */}
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

              {/* Bảo mật */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900 font-medium">
                <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>
                  Phiên kết nối Zalo của bạn được lưu riêng biệt, an toàn. Hệ thống chỉ đọc tin nhắn từ các nhóm bạn cho phép trong Whitelist.
                </span>
              </div>
            </div>

            {/* Cột phải: QR Code */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-[#F8F7FC] border border-slate-200 shadow-xl flex flex-col items-center justify-center text-center space-y-4">

                {status?.qrStatus === "generating" || isQrGenerating ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-xs sm:text-sm text-slate-500">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-extrabold text-slate-700">Đang tạo mã QR từ máy chủ Zalo...</span>
                  </div>
                ) : status?.qrStatus === "scanned" ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
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
                      disabled={isQrGenerating}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-200 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isQrGenerating ? "animate-spin" : ""}`} />
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
                      disabled={isQrGenerating}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-200 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isQrGenerating ? "animate-spin" : ""}`} />
                      <span>Tạo mã QR đăng nhập</span>
                    </button>
                  </div>
                )}

                {/* Nút Làm mới QR */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateQr}
                    disabled={isQrGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isQrGenerating ? "animate-spin" : ""}`} />
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
        isLoading={isLoggingOut}
        title="Xác nhận ngắt kết nối Zalo"
        description="Bạn có chắc chắn muốn đăng xuất tài khoản Zalo cá nhân? Phiên làm việc sẽ bị xóa và hệ thống sẽ dừng lắng nghe tin nhắn từ tài khoản này."
        itemName={status?.user?.displayName || "Tài khoản Zalo"}
        confirmText="Ngắt kết nối"
        cancelText="Giữ lại"
      />
    </div>
  );
}
