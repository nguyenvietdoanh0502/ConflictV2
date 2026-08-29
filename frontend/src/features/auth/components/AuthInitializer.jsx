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
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#F7F5FF] px-5 text-[#2F2A45]">
        <span
          className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#FFD8BE]/[.55] blur-3xl"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -right-20 bottom-16 h-72 w-72 rounded-full bg-[#B8EADD]/50 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-4 rounded-[28px] border border-white/90 bg-white/80 px-8 py-7 shadow-[0_24px_60px_rgba(73,58,128,0.14)] backdrop-blur-xl">
          <span
            className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#E6E0F6] border-t-[#7C6EE6] motion-reduce:animate-none"
            aria-hidden="true"
          />

          <p className="text-sm font-semibold text-[#777087]">
            Đang khôi phục phiên đăng nhập...
          </p>
        </div>
      </div>
    );
    }

    return children;
}
