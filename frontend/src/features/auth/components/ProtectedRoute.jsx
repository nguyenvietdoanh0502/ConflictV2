import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectAuthInitialized,
} from "../authSelectors";

export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  const isInitialized = useSelector(selectAuthInitialized,);
  if(!isInitialized){
    return null;
  }
  

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}