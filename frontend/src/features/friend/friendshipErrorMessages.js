const errorMessages = {
  MISSING_PIN_CODE: "Vui lòng nhập mã người dùng.",
  INVALID_PIN_CODE: "Mã phải có dạng RML-123456.",
  PIN_CODE_NOT_FOUND: "Không tìm thấy người dùng với mã này.",
  CANNOT_FRIEND_SELF: "Bạn không thể tự gửi lời mời cho chính mình.",
  FRIEND_REQUEST_ALREADY_SENT: "Bạn đã gửi lời mời cho người này.",
  FRIEND_REQUEST_ALREADY_RECEIVED:
    "Người này đã gửi lời mời cho bạn. Hãy kiểm tra lời mời đến.",
  FRIEND_REQUEST_ALREADY_EXISTS: "Lời mời kết bạn đã tồn tại.",
  ALREADY_FRIENDS: "Hai người đã là bạn bè.",
  FRIEND_REQUEST_NOT_FOUND: "Lời mời này không còn tồn tại.",
  INVALID_FRIEND_REQUEST_STATE: "Trạng thái lời mời vừa thay đổi.",
  FRIEND_REQUEST_FORBIDDEN: "Bạn không thể thực hiện thao tác này.",
  FRIENDSHIP_NOT_FOUND: "Quan hệ bạn bè này không còn tồn tại.",
  FRIENDSHIP_FORBIDDEN: "Bạn không thể xóa quan hệ bạn bè này.",
};

export function getFriendshipErrorMessage(error){
    if(error?.status === "FETCH_ERROR"){
        return "Không kết nối được tới backend"
    }
    const errorCode = error?.data?.errorCode;

    return (
        errorMessages[errorCode] || error?.data?.message || "Có lỗi không xác định."
    )
}