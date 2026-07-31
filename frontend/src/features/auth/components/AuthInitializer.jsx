import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRefreshTokenMutation } from "../authApi";
import { useLazyGetCurrentUserQuery } from "../../profile/userApi";
import {
  clearCredentials,
  setAccessToken,
  setAuthInitialized,
  setCredentials,
} from "../authSlice";
import { selectAuthInitialized } from "../authSelectors";

export default function AuthInitializer({children}){
    const dispatch = useDispatch();
    const isInitialized = useSelector(
        selectAuthInitialized,
    )
    const hasStarted = useRef(false)
    const [refreshToken] = useRefreshTokenMutation();
    const [getCurrentUser] = useLazyGetCurrentUserQuery();

    useEffect(()=>{
        if(hasStarted.current){
            return;
        }
        hasStarted.current = true;
        async function initializeAuth(){
            try{
                const refreshResponse = 
                    await refreshToken().unwrap();
                const accessToken = refreshResponse?.data?.accessToken;
                if(!accessToken){
                    throw new Error(
                        "API refresh không trả về accessToken",
                    )
                }
                dispatch(setAccessToken(accessToken))
                const userResponse = await getCurrentUser().unwrap()
                const user = userResponse?.data;
                if(!user){
                    throw new Error(
                        "API không trả về người dùng",
                    )
                }
                dispatch(
                    setCredentials({
                        user,
                        accessToken,
                    }),
                )
            } catch{
                dispatch(clearCredentials())
            } finally {
                dispatch(setAuthInitialized(true))
            }
        }
        initializeAuth();
    },[dispatch,refreshToken,getCurrentUser]);
    if(!isInitialized){
        return (
      <div className="grid min-h-screen place-items-center bg-[#141414] text-white">
        <div className="flex flex-col items-center gap-4">
          <span
            className="h-10 w-10 animate-spin rounded-full border-2 border-[#333333] border-t-[#E50000]"
            aria-hidden="true"
          />

          <p className="text-sm text-[#999999]">
            Đang khôi phục phiên đăng nhập...
          </p>
        </div>
      </div>
    );
    }

    return children;
}