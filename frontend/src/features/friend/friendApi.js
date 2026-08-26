import { baseApi } from "../../services/baseApi";

export const friendApi = baseApi.injectEndpoints({
    endpoints: (builder) =>({
        getFriends: builder.query({
            query: ()=> "/v1/friends",
            transformResponse: (response) => response.data,
            providesTags: [
                {type: "Friend", id: "LIST"}
            ],
        }),
        getIncomingFriendRequests: builder.query({
            query: ()=>"/v1/friends/requests/incoming",
            transformResponse: (response)=> response.data,
            providesTags:[
                {type: "FriendRequest",id:"INCOMING"},
            ],
        }),
        getOutgoingFriendRequests: builder.query({
            query: ()=>"/v1/friends/requests/outgoing",
            transformResponse: (response)=> response.data,
            providesTags:[
                {type: "FriendRequest",id:"OUTGOING"},
            ],
        }),
        sendFriendRequest: builder.mutation({
            query: ({pinCode}) => ({
                url: "/v1/friends/requests",
                method: "POST",
                body: {pinCode},
            }),
            invalidatesTags: [
                {type: "FriendRequest",id:"OUTGOING"},
            ]
        }),
        acceptFriendRequest: builder.mutation({
            query: (requestId) =>({
                url: `/v1/friends/requests/${requestId}/accept`,
                method: "PATCH",
            }),
            invalidatesTags: [
                {type: "Friend",id:"LIST"},
                {type: "FriendRequest", id: "INCOMING"},
            ]
        }),
        removeFriendRequest: builder.mutation({
            query: (requestId)=>({
                url: `/v1/friends/requests/${requestId}`,
                method: "DELETE",
            }),
            invalidatesTags: [
                {type: "FriendRequest", id:"INCOMING"},
                {type: "FriendRequest", id:"OUTGOING"},
            ]
        }),
        removeFriend: builder.mutation({
            query: (friendshipId)=>({
                url:`/v1/friends/${friendshipId}`,
                method: "DELETE",
            }),
            invalidatesTags: [
                {type: "Friend", id:"LIST"}
            ]
        })
    })
})

export const{
    useGetFriendsQuery,
    useGetIncomingFriendRequestsQuery,
    useGetOutgoingFriendRequestsQuery,
    useSendFriendRequestMutation,
    useAcceptFriendRequestMutation,
    useRemoveFriendRequestMutation,
    useRemoveFriendMutation,
} = friendApi;