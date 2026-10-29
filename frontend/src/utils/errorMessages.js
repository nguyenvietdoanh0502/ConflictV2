/**
 * Bộ từ điển và hàm chuẩn hóa thông báo lỗi sang Tiếng Việt cho toàn bộ hệ thống UniSync
 */

export const ERROR_CODE_TRANSLATIONS = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác.",
  UNAUTHENTICATED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  UNAUTHORIZED: "Bạn không có quyền thực hiện thao tác này.",
  ACCOUNT_NOT_VERIFIED: "Tài khoản chưa được xác thực. Vui lòng kiểm tra mã OTP trong email.",
  ACCOUNT_BANNED: "Tài khoản của bạn đã bị tạm khóa do vi phạm tiêu chuẩn cộng đồng.",
  ACCOUNT_LOCKED: "Tài khoản đã bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.",
  INVALID_REFRESH_TOKEN: "Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",

  // Validation & Input
  MISSING_EMAIL: "Vui lòng nhập địa chỉ email.",
  INVALID_EMAIL: "Địa chỉ email không đúng định dạng.",
  MISSING_PASSWORD: "Vui lòng nhập mật khẩu.",
  INVALID_PASSWORD: "Mật khẩu phải có ít nhất 8 ký tự.",
  WEAK_PASSWORD: "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
  MISSING_CONFIRM_PASSWORD: "Vui lòng xác nhận lại mật khẩu.",
  PASSWORD_MISMATCH: "Mật khẩu xác nhận không trùng khớp.",
  MISSING_FULL_NAME: "Vui lòng nhập họ và tên.",
  INVALID_FULL_NAME: "Họ và tên phải có độ dài từ 2 đến 100 ký tự.",
  INVALID_DATE_OF_BIRTH: "Ngày sinh không hợp lệ hoặc nằm trong tương lai.",
  INVALID_ADDRESS: "Địa chỉ không được vượt quá 255 ký tự.",
  INVALID_GENDER: "Giới tính không hợp lệ.",
  MISSING_OTP: "Vui lòng nhập mã OTP.",
  INVALID_OTP_FORMAT: "Mã OTP phải gồm đúng 6 chữ số.",
  USERNAME_INVALID: "Tên người dùng phải có ít nhất 3 ký tự.",
  INVALID_DOB: "Độ tuổi của bạn chưa đủ điều kiện tham gia.",

  // Business Logic
  USER_EXISTED: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.",
  USER_NOT_EXISTED: "Không tìm thấy tài khoản với email này.",
  RESOURCE_NOT_FOUND: "Dữ liệu yêu cầu không tồn tại.",
  CONCURRENCY_CONFLICT: "Dữ liệu đang được hệ thống xử lý, vui lòng thử lại sau giây lát.",
  RATE_LIMIT_EXCEEDED: "Bạn thao tác quá nhanh. Vui lòng chờ giây lát rồi thử lại.",

  // Password Management
  OTP_EXPIRED_OR_INVALID: "Mã OTP đã hết hạn hoặc không chính xác. Vui lòng lấy mã mới.",
  OTP_INVALID: "Mã OTP không chính xác. Vui lòng kiểm tra lại.",
  INVALID_OLD_PASSWORD: "Mật khẩu hiện tại không chính xác.",
  MISSING_RESET_TOKEN: "Mã xác thực đổi mật khẩu không hợp lệ hoặc đã hết hạn.",
  SAME_PASSWORD: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",

  // Profile & Media
  INVALID_AVATAR_FILE: "Ảnh đại diện phải có định dạng JPEG, PNG hoặc WebP.",
  AVATAR_TOO_LARGE: "Kích thước ảnh đại diện không được vượt quá 5 MB.",
  AVATAR_UPLOAD_FAILED: "Không thể tải ảnh lên máy chủ. Vui lòng thử lại sau.",
  AVATAR_DELETE_FAILED: "Không thể xóa ảnh cũ.",

  // Friendship
  MISSING_PIN_CODE: "Vui lòng nhập mã người dùng.",
  INVALID_PIN_CODE: "Mã người dùng không hợp lệ (ví dụ: UNI-123456).",
  PIN_CODE_NOT_FOUND: "Không tìm thấy người dùng với mã này.",
  CANNOT_FRIEND_SELF: "Bạn không thể tự gửi lời mời kết bạn cho chính mình.",
  FRIEND_REQUEST_ALREADY_SENT: "Bạn đã gửi lời mời kết bạn cho người này rồi.",
  FRIEND_REQUEST_ALREADY_RECEIVED: "Người này đã gửi lời mời kết bạn cho bạn. Vui lòng kiểm tra mục lời mời.",
  FRIEND_REQUEST_ALREADY_EXISTS: "Lời mời kết bạn đã tồn tại.",
  ALREADY_FRIENDS: "Hai bạn đã là bạn bè của nhau.",
  FRIEND_REQUEST_NOT_FOUND: "Lời mời kết bạn không còn tồn tại.",
  INVALID_FRIEND_REQUEST_STATE: "Trạng thái lời mời kết bạn vừa thay đổi.",
  FRIEND_REQUEST_FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  FRIENDSHIP_NOT_FOUND: "Quan hệ bạn bè không còn tồn tại.",
  FRIENDSHIP_FORBIDDEN: "Bạn không thể hủy quan hệ bạn bè này.",
  NOT_FRIENDS: "Hai người chưa phải là bạn bè.",

  // Chat
  MISSING_RECIPIENT_ID: "Thiếu thông tin người nhận tin nhắn.",
  MISSING_MESSAGE_CONTENT: "Nội dung tin nhắn không được để trống.",
  MESSAGE_TOO_LONG: "Tin nhắn không được vượt quá 2000 ký tự.",
  CHAT_RECIPIENT_NOT_FOUND: "Không tìm thấy người nhận tin nhắn.",
  CANNOT_MESSAGE_SELF: "Bạn không thể tự gửi tin nhắn cho chính mình.",
  INVALID_PAGINATION: "Tham số phân trang không hợp lệ.",

  // Subject & Timetable
  SUBJECT_NOT_FOUND: "Không tìm thấy môn học.",
  SUBJECT_FORBIDDEN: "Bạn không có quyền truy cập môn học này.",
  SUBJECT_ALREADY_EXISTS: "Môn học này đã tồn tại trong danh sách của bạn.",
  ZALO_MAPPING_NOT_FOUND: "Không tìm thấy liên kết nhóm Zalo.",
  ZALO_MAPPING_FORBIDDEN: "Bạn không có quyền chỉnh sửa liên kết nhóm này.",
  ZALO_MAPPING_ALREADY_EXISTS: "Nhóm Zalo này đã được liên kết với một môn học khác.",
  SCHEDULE_EVENT_NOT_FOUND: "Không tìm thấy sự kiện lịch học.",
  SCHEDULE_EVENT_FORBIDDEN: "Bạn không có quyền thao tác trên lịch học này.",
  INVALID_SCHEDULE_TIME: "Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu.",
  AI_SERVICE_UNAVAILABLE: "Hệ thống AI đang bận hoặc tạm thời gián đoạn. Vui lòng thử lại sau.",

  // Study & Minigame
  MATERIAL_NOT_FOUND: "Không tìm thấy tài liệu học tập.",
  MATERIAL_FORBIDDEN: "Bạn không có quyền truy cập tài liệu này.",
  INVALID_MATERIAL_FILE: "Hệ thống chỉ hỗ trợ định dạng PDF, DOCX, TXT dung lượng dưới 20MB.",
  MATERIAL_PARSE_FAILED: "Không thể trích xuất văn bản từ tài liệu (file có thể trống hoặc là ảnh chụp).",
  MATERIAL_PROCESSING_FAILED: "Không thể tạo tài liệu ôn tập qua AI. Vui lòng thử lại sau.",
  INVALID_GAME_TYPE: "Chế độ minigame không hợp lệ.",
  MATERIAL_FILE_NOT_FOUND: "Tài liệu này chưa có tệp gốc lưu trữ trên máy chủ.",
  MINIGAME_NOT_GENERATED: "Vui lòng khởi tạo bộ Minigame trước khi gửi lời mời thách đấu.",

  // Generic System
  UNCATEGORIZED_EXCEPTION: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.",
  INVALID_KEY: "Dữ liệu yêu cầu không hợp lệ."
};

export const ENGLISH_PHRASE_TRANSLATIONS = {
  "invalid credentials": "Email hoặc mật khẩu không chính xác.",
  "unauthenticated": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "you do not have permission": "Bạn không có quyền thực hiện thao tác này.",
  "account is not verified": "Tài khoản chưa được xác thực. Vui lòng kiểm tra mã OTP trong email.",
  "account has been banned": "Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn.",
  "your account has been locked, try again in 15 minutes": "Tài khoản đã bị tạm khóa. Vui lòng thử lại sau 15 phút.",
  "invalid or expired refresh token": "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
  "email is required": "Vui lòng nhập địa chỉ email.",
  "email is not valid": "Địa chỉ email không đúng định dạng.",
  "password is required": "Vui lòng nhập mật khẩu.",
  "password must be at least 8 characters": "Mật khẩu phải có ít nhất 8 ký tự.",
  "passwords do not match": "Mật khẩu xác nhận không trùng khớp.",
  "full name is required": "Vui lòng nhập họ và tên.",
  "full name must be between 2 and 100 characters": "Họ và tên phải có từ 2 đến 100 ký tự.",
  "otp is required": "Vui lòng nhập mã OTP.",
  "otp must be exactly 6 digits": "Mã OTP phải gồm đúng 6 chữ số.",
  "user existed": "Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.",
  "user not existed": "Không tìm thấy tài khoản với email này.",
  "user was not found": "Không tìm thấy thông tin người dùng.",
  "resource not found": "Không tìm thấy dữ liệu yêu cầu.",
  "otp code has expired or is invalid": "Mã OTP đã hết hạn hoặc không hợp lệ. Vui lòng lấy mã mới.",
  "invalid otp code": "Mã OTP không chính xác. Vui lòng kiểm tra lại.",
  "current password is incorrect": "Mật khẩu hiện tại không chính xác.",
  "new password must be different from current password": "Mật khẩu mới không được trùng với mật khẩu cũ.",
  "pin code is required": "Vui lòng nhập mã người dùng.",
  "pin code is invalid": "Mã người dùng không hợp lệ.",
  "you cannot add yourself as a friend": "Bạn không thể tự kết bạn với chính mình.",
  "friend request has already been sent": "Bạn đã gửi lời mời kết bạn cho người này rồi.",
  "this user has already sent you a friend request": "Người này đã gửi lời mời kết bạn cho bạn.",
  "a friend request already exists": "Lời mời kết bạn đã tồn tại.",
  "users are already friends": "Hai bạn đã là bạn bè.",
  "friend request was not found": "Lời mời kết bạn không còn tồn tại.",
  "friendship was not found": "Quan hệ bạn bè không còn tồn tại.",
  "uncategorized exception": "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.",
  "network error": "Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền Internet.",
  "failed to fetch": "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
  "bad credentials": "Email hoặc mật khẩu không chính xác.",
  "user not found": "Không tìm thấy tài khoản người dùng."
};

/**
 * Chuẩn hóa lỗi API trả về thành thông điệp Tiếng Việt thân thiện
 * @param {any} error - Lỗi từ RTK Query hoặc fetch/try-catch
 * @param {string} defaultFallback - Thông điệp mặc định khi không xác định được
 * @returns {string} - Thông điệp tiếng Việt
 */
export function getLocalizedErrorMessage(error, defaultFallback = "Đã có lỗi xảy ra. Vui lòng thử lại sau.") {
  if (!error) return defaultFallback;

  // Lỗi mạng hoặc server không phản hồi
  if (error.status === "FETCH_ERROR") {
    return "Không kết nối được tới máy chủ. Vui lòng kiểm tra server hoặc kết nối mạng.";
  }

  // 1. Kiểm tra theo mã lỗi errorCode từ backend (ví dụ: INVALID_CREDENTIALS)
  const errorCode = error.data?.errorCode || error.errorCode;
  if (errorCode && ERROR_CODE_TRANSLATIONS[errorCode]) {
    return ERROR_CODE_TRANSLATIONS[errorCode];
  }

  // 2. Kiểm tra theo nội dung chuỗi message
  const rawMessage = (
    typeof error.data?.message === "string"
      ? error.data.message
      : typeof error.message === "string"
      ? error.message
      : ""
  ).trim();

  if (rawMessage) {
    const lower = rawMessage.toLowerCase();

    // Đối chiếu trực tiếp từ điển
    if (ENGLISH_PHRASE_TRANSLATIONS[lower]) {
      return ENGLISH_PHRASE_TRANSLATIONS[lower];
    }

    // Đối chiếu một phần (partial match)
    for (const [key, translated] of Object.entries(ENGLISH_PHRASE_TRANSLATIONS)) {
      if (lower.includes(key)) {
        return translated;
      }
    }

    // Nếu thông báo là tiếng Anh nguyên bản (không chứa dấu tiếng Việt)
    if (/^[a-zA-Z0-9\s.,!?:;'"\-_()]+$/.test(rawMessage)) {
      if (/credential/i.test(rawMessage)) return "Email hoặc mật khẩu không chính xác.";
      if (/password/i.test(rawMessage)) return "Mật khẩu không hợp lệ hoặc không chính xác.";
      if (/email/i.test(rawMessage)) return "Địa chỉ email không hợp lệ hoặc đã được sử dụng.";
      if (/otp/i.test(rawMessage)) return "Mã OTP không hợp lệ hoặc đã hết hạn.";
      if (/exist/i.test(rawMessage) && /user/i.test(rawMessage)) return "Tài khoản đã tồn tại hoặc không tìm thấy.";
      if (/not found/i.test(rawMessage)) return "Không tìm thấy dữ liệu yêu cầu.";
      if (/permission|unauthorized|forbidden|access denied/i.test(rawMessage)) return "Bạn không có quyền thực hiện thao tác này.";
      if (/timeout|connection|network|refused/i.test(rawMessage)) return "Lỗi kết nối máy chủ. Vui lòng thử lại.";
      return defaultFallback;
    }

    // Nếu đã là tiếng Việt thì giữ nguyên
    return rawMessage;
  }

  return defaultFallback;
}
