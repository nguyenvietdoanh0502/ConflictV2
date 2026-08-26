import { useState } from "react";
import AddFriendForm from "../components/AddFriendForm";
import FriendCard from "../components/FriendCard";
import FriendRequestCard from "../components/FriendRequestCard";
import FriendsSection from "../components/FriendsSection";
import { useAcceptFriendRequestMutation, useGetFriendsQuery,useGetIncomingFriendRequestsQuery, useGetOutgoingFriendRequestsQuery, useRemoveFriendMutation, useRemoveFriendRequestMutation, useSendFriendRequestMutation } from "../friendApi";
import { getFriendshipErrorMessage } from "../friendshipErrorMessages";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../auth/authSelectors";
import RemoveFriendModal from "../components/RemoveFriendModal";

export default function FriendsPage() {
  const currentUser = useSelector(selectCurrentUser)
  const [pinCode, setPinCode] = useState("");
  const [formFeedback, setFormFeedback] = useState(null);
  const [sendFriendRequest, {isLoading:isSending}] = useSendFriendRequestMutation();
  const [acceptFriendRequest] = useAcceptFriendRequestMutation();
  const [removeFriendRequest] = useRemoveFriendRequestMutation();
  const [pendingAction, setPendingAction]= useState(null);
  const [friendToRemove, setFriendToRemove] = useState(null);
  const [removeFriendError, setRemoveFriendError] = useState("")
  const [removeFriend, {isLoading: isRemovingFriend}] = useRemoveFriendMutation();
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

  const handleSendFriendRequest = async(event) =>{
    event.preventDefault();
    setFormFeedback(null)
    const normalizedPinCode = pinCode.trim().toUpperCase()
    if (!/^RML-\d{6}$/.test(normalizedPinCode)) {
      setFormFeedback({
        type: "error",
        message: "Mã phải có dạng RML-123456.",
      });
      return;
    }
    try{
      await sendFriendRequest({pinCode: normalizedPinCode}).unwrap()
      setPinCode("")
      setFormFeedback({
        type: "success",
        message: "Đã gửi lời mời kết bạn.",
      })
    }catch(error){
      setFormFeedback({
        type: "error",
        message: getFriendshipErrorMessage(error)
      })
    }
  }
  const handleAcceptRequest = async(request)=>{
    setPendingAction({type:"accept",id: request.requestId});
    try{
      await acceptFriendRequest(request.requestId).unwrap();
    }catch(error){
      setFormFeedback({
        type: "error",
        message: getFriendshipErrorMessage(error)
      })
    }finally{
      setPendingAction(null)
    }
  }
  const handleRemoveRequest = async (request) => {
    setPendingAction({ type: "remove-request", id: request.requestId });

    try {
      await removeFriendRequest(request.requestId).unwrap();
    } catch (error) {
      setFormFeedback({
        type: "error",
        message: getFriendshipErrorMessage(error)
      })
    } finally {
      setPendingAction(null);
    }
  };
  const handleConfirmRemoveFriend = async()=>{
    if(!friendToRemove || isRemovingFriend){
      return;
    }
    setRemoveFriendError("");
    try{
      await removeFriend(friendToRemove.friendshipId).unwrap();
      setFriendToRemove(null);
    }catch(error){
      setRemoveFriendError(getFriendshipErrorMessage(error))
    }
  }
  const handleCloseRemoveFriend = () =>{
    setFriendToRemove(null)
    setRemoveFriendError("")
  }
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#2B2B2B] bg-gradient-to-br from-[#1D1D1D] via-[#171717] to-[#111111] p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E50000]">
              Trung tâm kết nối
            </p>
            <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              Xem phim vui hơn cùng bạn bè
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#8B8B8B]">
              Quản lý bạn bè, phản hồi lời mời đến và theo dõi những lời mời
              bạn đã gửi tại một nơi.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ["Bạn bè", friends.length],
              ["Lời mời đến", incomingRequests.length],
              ["Đang chờ", outgoingRequests.length],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-xl border border-[#303030] bg-[#111111]/80 px-3 py-3 text-center sm:min-w-24"
              >
                <dd className="text-lg font-bold text-white">{value}</dd>
                <dt className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[#707070]">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <AddFriendForm 
        currentUserPinCode={currentUser?.pinCode || "Chưa có mã"}
        onCopyPinCode={async()=>{
          if(!currentUser?.pinCode) return;
          await navigator.clipboard.writeText(currentUser.pinCode)
        }}
        pinCode={pinCode}
        onPinCodeChange={(event)=>{
          setPinCode(event.target.value.toUpperCase());
          setFormFeedback(null);
        }}
        feedback={formFeedback}
        onSubmit={handleSendFriendRequest}
        isSubmitting={isSending}
      />

      <div className="grid items-start gap-6 xl:grid-cols-2">
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
                <FriendRequestCard request={request} direction="incoming" onAccept={handleAcceptRequest} onRemove={handleRemoveRequest} isBusy={pendingAction?.id === request.requestId}/>
              </li>
            ))}
          </ul>
        </FriendsSection>

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
          emptyDescription="Dùng mã RML ở biểu mẫu phía trên để bắt đầu kết nối."
        >
          <ul className="space-y-3">
            {outgoingRequests.map((request) => (
              <li key={request.requestId}>
                <FriendRequestCard request={request} direction="outgoing" onRemove={handleRemoveRequest} isBusy={pendingAction?.id === request.requestId}/>
              </li>
            ))}
          </ul>
        </FriendsSection>
      </div>

      <FriendsSection
        sectionId="friend-list"
        eyebrow="Kết nối hiện tại"
        title="Danh sách bạn bè"
        description="Những tài khoản đã chấp nhận kết nối với bạn."
        itemCount={friends.length}
        isLoading={isFriendsLoading}
        isError={isFriendsError}
        onRetry={refetchFriends}
        emptyTitle="Danh sách bạn bè đang trống"
        emptyDescription="Gửi lời mời hoặc chấp nhận một lời mời đến để thêm người đầu tiên."
      >
        <ul className="grid gap-3 lg:grid-cols-2">
          {friends.map((friend) => (
            <li key={friend.friendshipId}>
              <FriendCard friend={friend} 
              onRemove={setFriendToRemove}
              isRemoving={
                isRemovingFriend && friendToRemove?.friendshipId === friend.friendshipId
              }
              />
            </li>
          ))}
        </ul>
      </FriendsSection>
      <RemoveFriendModal
        isOpen={Boolean(friendToRemove)}
        friend={friendToRemove}
        isRemoving={isRemovingFriend}
        errorMessage={removeFriendError}
        onClose={handleCloseRemoveFriend}
        onConfirm={handleConfirmRemoveFriend}
      />
    </div>
  );
}

