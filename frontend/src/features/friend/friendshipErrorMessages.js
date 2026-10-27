import { getLocalizedErrorMessage } from "../../utils/errorMessages";

export function getFriendshipErrorMessage(error) {
  return getLocalizedErrorMessage(error, "Thao tác kết bạn thất bại. Vui lòng thử lại.");
}
