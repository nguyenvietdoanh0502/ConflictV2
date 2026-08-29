# Hướng dẫn hoàn thiện frontend Friendship

Khung JSX/Tailwind đã được dựng sẵn. Mục tiêu của bạn là tự nối logic tại
`pages/FriendsPage.jsx`, còn các component trong `components/` chỉ nhận props và
hiển thị giao diện.

## 1. Hiểu kiến trúc trước khi code

Luồng dữ liệu nên đi theo một chiều:

```text
Backend friendship
        ↓
friendApi.js (query, mutation và cache)
        ↓
FriendsPage.jsx (state + handler)
        ↓
AddFriendForm / FriendCard / FriendRequestCard / FriendsSection
```

- **Query** dùng để đọc dữ liệu: bạn bè, lời mời đến, lời mời đã gửi.
- **Mutation** dùng để thay đổi dữ liệu: gửi, chấp nhận, xóa lời mời, xóa bạn.
- **RTK Query cache** giữ dữ liệu server. Không cần tạo thêm `friendSlice`.
- **useState** chỉ giữ trạng thái của giao diện: mã PIN đang nhập, thông báo,
  item đang xử lý và modal đang mở.
- `FriendsPage` là container. Card/form không tự gọi API để tránh logic bị rải
  khắp feature.

## 2. Hợp đồng API thật của backend

`VITE_API_URL` hiện là `http://localhost:8080/api`, vì vậy URL `/v1/...` trong
`friendApi.js` sẽ trở thành `/api/v1/...` khi gửi request.

| Việc cần làm | Method và URL frontend | ID/body |
| --- | --- | --- |
| Lấy bạn bè | `GET /v1/friends` | Không có |
| Lấy lời mời đến | `GET /v1/friends/requests/incoming` | Không có |
| Lấy lời mời đã gửi | `GET /v1/friends/requests/outgoing` | Không có |
| Gửi lời mời | `POST /v1/friends/requests` | `{ pinCode }` |
| Chấp nhận | `PATCH /v1/friends/requests/{id}/accept` | `requestId` |
| Từ chối/hủy lời mời | `DELETE /v1/friends/requests/{id}` | `requestId` |
| Hủy kết bạn | `DELETE /v1/friends/{id}` | `friendshipId` |

Một phần tử bạn bè có dạng:

```js
{
  friendshipId: "uuid",
  user: {
    id: "uuid",
    fullName: "Nguyễn Văn A",
    avatarUrl: null,
  },
  friendsSince: "2026-08-26T10:30:00Z",
}
```

Một lời mời có dạng:

```js
{
  requestId: "uuid",
  user: {
    id: "uuid",
    fullName: "Nguyễn Văn B",
    avatarUrl: null,
  },
  status: "PENDING",
  createdAt: "2026-08-26T10:20:30Z",
}
```

Hai quy tắc rất dễ nhầm:

1. Chấp nhận/từ chối/hủy lời mời dùng `requestId`, không dùng `user.id`.
2. Hủy kết bạn dùng `friendshipId`, không dùng `user.id`.

## 3. Bước 1 — sửa API layer hiện có

Bạn đang còn hai lỗi tích hợp. Hãy tự sửa rồi chạy build để kiểm tra.

Trong `services/baseApi.js`, đăng ký đủ cache tag:

```js
tagTypes: ["CurrentUser", "Friend", "FriendRequest"],
```

Trong `friendApi.js`, endpoint outgoing phải có `requests` số nhiều:

```js
query: () => "/v1/friends/requests/outgoing",
```

Tại sao cần tag?

- Query `getFriends` gắn tag `Friend/LIST`.
- Mutation accept hoặc remove friend làm tag đó mất hiệu lực.
- RTK Query thấy query đang được sử dụng và tự gọi lại backend.
- Bạn không phải tự sửa mảng trong Redux hoặc gọi `refetch()` sau mutation.

Ba query đang có `transformResponse: response => response.data`. Vì vậy hook trả
thẳng mảng:

```js
const { data: friends = [] } = useGetFriendsQuery();
// Dùng friends.map(...), không dùng friends.data.map(...).
```

Các mutation chưa transform. `await mutation(...).unwrap()` vẫn trả toàn bộ
`ApiResponse`, nhưng phần lớn handler chỉ cần biết promise thành công hay thất bại.

## 4. Bước 2 — nối ba query vào trang

Thêm import vào `pages/FriendsPage.jsx`:

```js
import {
  useGetFriendsQuery,
  useGetIncomingFriendRequestsQuery,
  useGetOutgoingFriendRequestsQuery,
} from "../friendApi";
```

Trong component, thay toàn bộ mảng/cờ tạm bằng:

```js
const {
  data: friends = [],
  isLoading: isFriendsLoading,
  isError: isFriendsError,
  refetch: refetchFriends,
} = useGetFriendsQuery();

const {
  data: incomingRequests = [],
  isLoading: isIncomingLoading,
  isError: isIncomingError,
  refetch: refetchIncoming,
} = useGetIncomingFriendRequestsQuery();

const {
  data: outgoingRequests = [],
  isLoading: isOutgoingLoading,
  isError: isOutgoingError,
  refetch: refetchOutgoing,
} = useGetOutgoingFriendRequestsQuery();
```

Sau đó truyền hàm thử lại vào đúng section:

```jsx
<FriendsSection
  // các props đã có
  onRetry={refetchIncoming}
/>
```

Làm tương tự với `refetchOutgoing` và `refetchFriends`.

Khi component mount, ba query hook tự chạy. `isLoading` chỉ đúng trong lần tải
đầu; khi cache tự cập nhật sau mutation, dữ liệu cũ vẫn được giữ nên giao diện
không nhấp nháy về skeleton.

## 5. Bước 3 — biến input thành controlled input

Import `useState`, sau đó tạo state:

```js
const [pinCode, setPinCode] = useState("");
const [formFeedback, setFormFeedback] = useState(null);
```

Nối props vào form:

```jsx
<AddFriendForm
  pinCode={pinCode}
  onPinCodeChange={(event) => {
    setPinCode(event.target.value.toUpperCase());
    setFormFeedback(null);
  }}
  feedback={formFeedback}
/>
```

“Controlled input” nghĩa là React state là nguồn dữ liệu duy nhất: input đọc từ
`pinCode`; mỗi lần gõ, `onChange` cập nhật lại `pinCode`.

## 6. Bước 4 — gửi lời mời

Import hook mutation và khởi tạo:

```js
const [sendFriendRequest, { isLoading: isSending }] =
  useSendFriendRequestMutation();
```

Handler nên làm đúng thứ tự: chặn reload, normalize, validate, gọi API, xử lý kết
quả.

```js
const handleSendFriendRequest = async (event) => {
  event.preventDefault();
  setFormFeedback(null);

  const normalizedPinCode = pinCode.trim().toUpperCase();

  if (!/^RML-\d{6}$/.test(normalizedPinCode)) {
    setFormFeedback({
      type: "error",
      message: "Mã phải có dạng RML-123456.",
    });
    return;
  }

  try {
    await sendFriendRequest({ pinCode: normalizedPinCode }).unwrap();
    setPinCode("");
    setFormFeedback({
      type: "success",
      message: "Đã gửi lời mời kết bạn.",
    });
  } catch (error) {
    setFormFeedback({
      type: "error",
      message: getFriendshipErrorMessage(error),
    });
  }
};
```

Nối thêm vào form:

```jsx
<AddFriendForm
  // các props ở bước trước
  onSubmit={handleSendFriendRequest}
  isSubmitting={isSending}
/>
```

`.unwrap()` rất quan trọng: mutation RTK Query mặc định luôn resolve về object
`{ data }` hoặc `{ error }`. Sau khi unwrap, request lỗi sẽ đi vào `catch`, giúp
code giống một promise thông thường.

Backend validate trước khi service gọi `trim()`, nên frontend phải gửi
`normalizedPinCode`, không gửi chuỗi gốc có khoảng trắng.

## 7. Bước 5 — dịch lỗi backend thành thông báo dễ hiểu

Tạo `friendshipErrorMessages.js` cạnh `friendApi.js`:

```js
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

export function getFriendshipErrorMessage(error) {
  if (error?.status === "FETCH_ERROR") {
    return "Không kết nối được tới backend.";
  }

  const errorCode = error?.data?.errorCode;

  return (
    errorMessages[errorCode] ||
    error?.data?.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
}
```

Lỗi nằm ở `error.data.errorCode`, không nằm ở `error.errorCode`, vì backend bọc
mọi lỗi trong `ApiResponse`.

## 8. Bước 6 — chấp nhận, từ chối và hủy lời mời

Khởi tạo hai mutation:

```js
const [acceptFriendRequest] = useAcceptFriendRequestMutation();
const [removeFriendRequest] = useRemoveFriendRequestMutation();
const [pendingAction, setPendingAction] = useState(null);
```

`pendingAction` có dạng `{ type, id }`. Nó giúp chỉ khóa đúng card đang chạy,
thay vì làm mọi nút trên trang cùng loading.

```js
const handleAcceptRequest = async (request) => {
  setPendingAction({ type: "accept", id: request.requestId });

  try {
    await acceptFriendRequest(request.requestId).unwrap();
  } catch (error) {
    // TODO: đưa lỗi vào một alert chung của trang.
  } finally {
    setPendingAction(null);
  }
};

const handleRemoveRequest = async (request) => {
  setPendingAction({ type: "remove-request", id: request.requestId });

  try {
    await removeFriendRequest(request.requestId).unwrap();
  } catch (error) {
    // TODO: đưa lỗi vào một alert chung của trang.
  } finally {
    setPendingAction(null);
  }
};
```

Một endpoint DELETE dùng cho cả hai trường hợp:

- Request incoming: hành động là “Từ chối”.
- Request outgoing: hành động là “Hủy lời mời”.

Nối vào card incoming:

```jsx
<FriendRequestCard
  request={request}
  direction="incoming"
  onAccept={handleAcceptRequest}
  onRemove={handleRemoveRequest}
  isBusy={pendingAction?.id === request.requestId}
/>
```

Card outgoing không truyền `onAccept`:

```jsx
<FriendRequestCard
  request={request}
  direction="outgoing"
  onRemove={handleRemoveRequest}
  isBusy={pendingAction?.id === request.requestId}
/>
```

Không gọi `refetch()` trong các handler này. Tag invalidation trong `friendApi.js`
sẽ tự cập nhật incoming/outgoing/friends.

## 9. Bước 7 — hủy kết bạn có xác nhận

Tạo state giữ người đang được chọn:

```js
const [friendToRemove, setFriendToRemove] = useState(null);
const [removeFriendError, setRemoveFriendError] = useState("");
const [removeFriend, { isLoading: isRemovingFriend }] =
  useRemoveFriendMutation();
```

Khi bấm card, chỉ mở modal:

```jsx
<FriendCard
  friend={friend}
  onRemove={setFriendToRemove}
  isRemoving={
    isRemovingFriend &&
    friendToRemove?.friendshipId === friend.friendshipId
  }
/>
```

Render modal ở cuối `FriendsPage`:

```jsx
import RemoveFriendModal from "../components/RemoveFriendModal";

<RemoveFriendModal
  isOpen={Boolean(friendToRemove)}
  friend={friendToRemove}
  isRemoving={isRemovingFriend}
  errorMessage={removeFriendError}
  onClose={() => {
    setFriendToRemove(null);
    setRemoveFriendError("");
  }}
  onConfirm={handleConfirmRemoveFriend}
/>
```

Handler xác nhận:

```js
const handleConfirmRemoveFriend = async () => {
  if (!friendToRemove) {
    return;
  }

  setRemoveFriendError("");

  try {
    await removeFriend(friendToRemove.friendshipId).unwrap();
    setFriendToRemove(null);
  } catch (error) {
    setRemoveFriendError(getFriendshipErrorMessage(error));
  }
};
```

`RemoveFriendModal` đã lo phần trình bày, focus ban đầu, khóa scroll, phím Escape,
focus trap và trả focus về nút cũ. Bạn chỉ viết state và mutation ở page.

## 10. Bước 8 — hiển thị mã của chính bạn và nút sao chép

User hiện tại đã nằm trong auth slice:

```js
const currentUser = useSelector(selectCurrentUser);
```

Nối vào form:

```jsx
<AddFriendForm
  currentUserPinCode={currentUser?.pinCode || "Chưa có mã"}
  onCopyPinCode={async () => {
    if (!currentUser?.pinCode) return;
    await navigator.clipboard.writeText(currentUser.pinCode);
  }}
  // các props còn lại
/>
```

Đây là dữ liệu của chính user đăng nhập. Không hiển thị PIN của người khác vì
`FriendUserDTO` không trả trường đó.

## 11. Cách tự kiểm tra sau mỗi bước

PowerShell của máy đang chặn `npm.ps1`, nên dùng `npm.cmd`:

```powershell
cd E:\ConflictV2\frontend
npm.cmd run build
npm.cmd exec -- eslint src/features/friend src/App.jsx src/services/baseApi.js
npm.cmd run dev
```

Ma trận kiểm thử thủ công:

1. Mở `/friends` khi chưa đăng nhập: phải chuyển tới `/login`.
2. Không có dữ liệu: cả ba khối hiện đúng empty state.
3. Backend tắt: từng khối hiện error và nút “Thử lại”.
4. PIN rỗng/sai dạng: không gọi API, hiện lỗi client.
5. PIN có chữ thường/dấu cách ngoài: normalize thành `RML-123456`.
6. PIN của chính mình: hiện `CANNOT_FRIEND_SELF` bằng tiếng Việt.
7. PIN không tồn tại: hiện `PIN_CODE_NOT_FOUND`.
8. Gửi thành công: input trống, outgoing tự cập nhật.
9. Accept: incoming giảm, friends tăng.
10. Từ chối/hủy: đúng request biến mất.
11. Hủy kết bạn: modal mở, Escape đóng, xác nhận xong friend biến mất.
12. Bấm một action hai lần nhanh: nút đúng row phải bị khóa.
13. Access token hết hạn: `baseApi` refresh rồi tự thử lại request.

## 12. Những lỗi nên tránh

- Không thêm `friendApi.reducer` vào store: nó đã inject vào `baseApi`.
- Không tạo `friendSlice` chỉ để lưu lại ba danh sách từ server.
- Không dùng `friends.data`: query đã transform thành mảng.
- Không dùng `user.id` cho endpoint delete/accept.
- Không tự append/filter mảng ngay từ đầu; để invalidation refetch cho dễ hiểu.
- Không dùng trạng thái online giả: backend chưa trả presence.
- Không viết tìm kiếm theo tên hoặc phân trang: backend chưa có endpoint đó.
- Không quên `.unwrap()` nếu muốn `catch` nhận lỗi mutation.
- Không chỉ hiện spinner bằng màu; luôn kèm text loading cho accessibility.

Khi hoàn thành hết 12 tình huống kiểm thử, phần friendship frontend cơ bản đã đủ
để sử dụng thực tế với backend hiện tại.
