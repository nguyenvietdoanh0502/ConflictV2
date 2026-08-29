import { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../auth/authSelectors";
import AddFriendForm from "../components/AddFriendForm";
import FriendCard from "../components/FriendCard";
import FriendRequestCard from "../components/FriendRequestCard";
import FriendsSection from "../components/FriendsSection";
import RemoveFriendModal from "../components/RemoveFriendModal";
import {
  useAcceptFriendRequestMutation,
  useGetFriendsQuery,
  useGetIncomingFriendRequestsQuery,
  useGetOutgoingFriendRequestsQuery,
  useRemoveFriendMutation,
  useRemoveFriendRequestMutation,
  useSendFriendRequestMutation,
} from "../friendApi";
import { getFriendshipErrorMessage } from "../friendshipErrorMessages";

function FriendTabIcon({ type }) {
  const sharedProps = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (type === "incoming") {
    return (
      <svg {...sharedProps}>
        <path d="M14.5 9a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM4.5 19c.8-2.6 3.1-4 6.5-4 1 0 2 .1 2.8.4" />
        <path d="M17.5 14v6m-3-3h6" />
      </svg>
    );
  }

  if (type === "outgoing") {
    return (
      <svg {...sharedProps}>
        <path d="M14.5 9a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM4.5 19c.8-2.6 3.1-4 6.5-4 1 0 2 .1 2.8.4" />
        <path d="m15 16 2.2 2.2L21 14.5" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="M15.5 19v-1.4c0-2.4-2-4.3-4.5-4.3s-4.5 1.9-4.5 4.3V19M11 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 10.5c2 .5 3.5 2.2 3.5 4.2V17" />
    </svg>
  );
}

export default function FriendsPage() {
  const currentUser = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState("friends");
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [formFeedback, setFormFeedback] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [friendToRemove, setFriendToRemove] = useState(null);
  const [removeFriendError, setRemoveFriendError] = useState("");

  const [sendFriendRequest, { isLoading: isSending }] =
    useSendFriendRequestMutation();
  const [acceptFriendRequest] = useAcceptFriendRequestMutation();
  const [removeFriendRequest] = useRemoveFriendRequestMutation();
  const [removeFriend, { isLoading: isRemovingFriend }] =
    useRemoveFriendMutation();

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

  const handleAcceptRequest = async (request) => {
    setPendingAction({ type: "accept", id: request.requestId });

    try {
      await acceptFriendRequest(request.requestId).unwrap();
    } catch (error) {
      setFormFeedback({
        type: "error",
        message: getFriendshipErrorMessage(error),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveRequest = async (request) => {
    setPendingAction({ type: "remove-request", id: request.requestId });

    try {
      await removeFriendRequest(request.requestId).unwrap();
    } catch (error) {
      setFormFeedback({
        type: "error",
        message: getFriendshipErrorMessage(error),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleConfirmRemoveFriend = async () => {
    if (!friendToRemove || isRemovingFriend) {
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

  const handleCloseRemoveFriend = () => {
    setFriendToRemove(null);
    setRemoveFriendError("");
  };

  const handleCopyPinCode = async () => {
    if (!currentUser?.pinCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUser.pinCode);
      setFormFeedback({
        type: "success",
        message: "Đã sao chép mã người dùng.",
      });
    } catch {
      setFormFeedback({
        type: "error",
        message: "Chưa thể sao chép mã. Vui lòng thử lại.",
      });
    }
  };

  const tabs = [
    {
      id: "friends",
      label: "Bạn bè",
      shortLabel: "Bạn bè",
      count: friends.length,
    },
    {
      id: "incoming",
      label: "Lời mời đã nhận",
      shortLabel: "Đã nhận",
      count: incomingRequests.length,
    },
    {
      id: "outgoing",
      label: "Lời mời đã gửi",
      shortLabel: "Đã gửi",
      count: outgoingRequests.length,
    },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsAddFriendOpen(false);
    setFormFeedback(null);
  };

  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F3F2F7] text-[#2F2A45]">
      <div className="min-h-[calc(100vh-4rem)]">
        <aside className="flex flex-col border-b border-[#E3E0E9] bg-white p-3 md:fixed md:bottom-0 md:left-0 md:top-16 md:z-30 md:w-[280px] md:overflow-y-auto md:border-b-0 md:border-r md:p-4 xl:w-[320px] xl:p-5">
          <header className="px-1 pb-3 pt-1 md:pb-4">
            <h1 className="text-2xl font-black tracking-[-0.03em] md:text-[28px]">
              Bạn bè
            </h1>
            <p className="mt-1.5 hidden text-sm leading-6 text-[#716A80] md:block">
              Quản lý các kết nối của bạn tại một nơi.
            </p>
          </header>

          <button
            type="button"
            onClick={() => {
              setIsAddFriendOpen((isOpen) => !isOpen);
              setFormFeedback(null);
            }}
            aria-expanded={isAddFriendOpen}
            aria-controls="add-friend-panel"
            className={`mb-2 flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 text-left text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/20 ${
              isAddFriendOpen
                ? "bg-[#E7E2FA] text-[#5E52B7]"
                : "bg-[#F0EDFF] text-[#5E52B7] hover:bg-[#E7E2FA]"
            }`}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#7C6EE6] text-lg leading-none text-white"
              aria-hidden="true"
            >
              {isAddFriendOpen ? "←" : "+"}
            </span>
            {isAddFriendOpen ? `Quay lại ${activeTabLabel}` : "Thêm bạn mới"}
          </button>

          <nav
            className="grid grid-cols-3 gap-1 md:grid-cols-1"
            aria-label="Các mục bạn bè"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id && !isAddFriendOpen;

              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1.5 py-2.5 text-center transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/20 md:min-h-[52px] md:flex-row md:gap-3 md:px-2.5 md:py-2 md:text-left ${
                    isActive
                      ? "bg-[#ECE8FB] text-[#5E52B7]"
                      : "text-[#625C70] hover:bg-[#F5F3F8]"
                  }`}
                >
                  {isActive ? (
                    <span
                      className="absolute bottom-2 left-0 top-2 hidden w-1 rounded-r-full bg-[#7C6EE6] md:block"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      isActive
                        ? "bg-white text-[#6B5ED0]"
                        : "bg-[#F0EEF5] text-[#625C70]"
                    }`}
                  >
                    <FriendTabIcon type={tab.id} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold md:hidden">
                      {tab.shortLabel}
                    </span>
                    <span className="hidden truncate text-sm font-extrabold md:block">
                      {tab.label}
                    </span>
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#6558C8] ring-1 ring-[#E8E4F5] md:text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto hidden border-t border-[#ECE9F1] px-1 pt-4 md:block">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#77718C]">
              Mã của bạn
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-[#F5F3F8] px-2.5 py-2 text-xs font-extrabold text-[#51478F]">
                {currentUser?.pinCode || "Chưa có mã"}
              </code>
              <button
                type="button"
                onClick={handleCopyPinCode}
                disabled={!currentUser?.pinCode}
                className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#6558C8] hover:bg-[#ECE8FB] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sao chép
              </button>
            </div>
          </div>
        </aside>

        <section
          id="friends-content-panel"
          aria-label={isAddFriendOpen ? "Thêm bạn mới" : activeTabLabel}
          className="min-w-0 px-3 py-5 sm:px-6 md:ml-[280px] md:px-7 md:py-7 lg:px-10 lg:py-8 xl:ml-[320px]"
        >
          <div className="mx-auto w-full max-w-[960px]">
            {isAddFriendOpen ? (
              <div id="add-friend-panel">
                <AddFriendForm
                  currentUserPinCode={currentUser?.pinCode || "Chưa có mã"}
                  onCopyPinCode={handleCopyPinCode}
                  pinCode={pinCode}
                  onPinCodeChange={(event) => {
                    setPinCode(event.target.value.toUpperCase());
                    setFormFeedback(null);
                  }}
                  feedback={formFeedback}
                  onSubmit={handleSendFriendRequest}
                  isSubmitting={isSending}
                />
              </div>
            ) : (
              <>
              {formFeedback?.message ? (
                <p
                  role={formFeedback.type === "error" ? "alert" : "status"}
                  className={`mb-4 rounded-[14px] border px-4 py-3 text-sm font-medium ${
                    formFeedback.type === "error"
                      ? "border-[#FFC6D8] bg-[#FFF1F6] text-[#A63E62]"
                      : "border-[#B8EADD] bg-[#EFFBF7] text-[#317968]"
                  }`}
                >
                  {formFeedback.message}
                </p>
              ) : null}

              {activeTab === "friends" ? (
                <FriendsSection
                  sectionId="friend-list"
                  eyebrow="Kết nối hiện tại"
                  title="Tất cả bạn bè"
                  description="Những tài khoản đã chấp nhận kết nối với bạn."
                  itemCount={friends.length}
                  isLoading={isFriendsLoading}
                  isError={isFriendsError}
                  onRetry={refetchFriends}
                  emptyTitle="Danh sách bạn bè đang trống"
                  emptyDescription="Chọn Thêm bạn mới hoặc chấp nhận một lời mời đến để bắt đầu."
                >
                  <ul className="grid gap-3 lg:grid-cols-2">
                    {friends.map((friend) => (
                      <li key={friend.friendshipId}>
                        <FriendCard
                          friend={friend}
                          onRemove={setFriendToRemove}
                          isRemoving={
                            isRemovingFriend &&
                            friendToRemove?.friendshipId === friend.friendshipId
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </FriendsSection>
              ) : null}

              {activeTab === "incoming" ? (
                <FriendsSection
                  sectionId="incoming-requests"
                  eyebrow="Cần bạn phản hồi"
                  title="Lời mời đã nhận"
                  description="Chấp nhận hoặc từ chối những người muốn kết nối với bạn."
                  itemCount={incomingRequests.length}
                  isLoading={isIncomingLoading}
                  isError={isIncomingError}
                  onRetry={refetchIncoming}
                  emptyTitle="Chưa có lời mời mới"
                  emptyDescription="Khi có người gửi lời mời, thông tin của họ sẽ xuất hiện tại đây."
                >
                  <ul className="space-y-3">
                    {incomingRequests.map((request) => (
                      <li key={request.requestId}>
                        <FriendRequestCard
                          request={request}
                          direction="incoming"
                          onAccept={handleAcceptRequest}
                          onRemove={handleRemoveRequest}
                          isBusy={pendingAction?.id === request.requestId}
                        />
                      </li>
                    ))}
                  </ul>
                </FriendsSection>
              ) : null}

              {activeTab === "outgoing" ? (
                <FriendsSection
                  sectionId="outgoing-requests"
                  eyebrow="Đợi người khác phản hồi"
                  title="Lời mời đã gửi"
                  description="Theo dõi hoặc hủy những lời mời vẫn đang chờ xử lý."
                  itemCount={outgoingRequests.length}
                  isLoading={isOutgoingLoading}
                  isError={isOutgoingError}
                  onRetry={refetchOutgoing}
                  emptyTitle="Bạn chưa gửi lời mời nào"
                  emptyDescription="Chọn Thêm bạn mới để gửi lời mời bằng mã RML."
                >
                  <ul className="space-y-3">
                    {outgoingRequests.map((request) => (
                      <li key={request.requestId}>
                        <FriendRequestCard
                          request={request}
                          direction="outgoing"
                          onRemove={handleRemoveRequest}
                          isBusy={pendingAction?.id === request.requestId}
                        />
                      </li>
                    ))}
                  </ul>
                </FriendsSection>
              ) : null}
              </>
            )}
          </div>
        </section>
      </div>

      <RemoveFriendModal
        isOpen={Boolean(friendToRemove)}
        friend={friendToRemove}
        isRemoving={isRemovingFriend}
        errorMessage={removeFriendError}
        onClose={handleCloseRemoveFriend}
        onConfirm={handleConfirmRemoveFriend}
      />
    </main>
  );
}
