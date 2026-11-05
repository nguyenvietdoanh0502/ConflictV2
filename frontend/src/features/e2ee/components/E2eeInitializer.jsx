import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../../auth/authSelectors";
import { useGetMyE2eeKeyQuery } from "../e2eeApi";
import { e2eeSession } from "../e2eeSession";
import { resetE2eeState, setE2eeState } from "../e2eeSlice";
import E2eeSetupModal from "./E2eeSetupModal";
import E2eeUnlockModal from "./E2eeUnlockModal";

export default function E2eeInitializer() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const { data: myKeyDto, isSuccess } = useGetMyE2eeKeyQuery(undefined, {
    skip: !isAuthenticated || !currentUser?.id,
  });

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) {
      dispatch(resetE2eeState());
      return;
    }

    if (!isSuccess || !myKeyDto) {
      return;
    }

    let cancelled = false;

    async function syncKeyStatus() {
      if (!myKeyDto.hasKey) {
        if (!cancelled) {
          dispatch(setE2eeState({ status: "not_setup", keyVersion: null }));
        }
        return;
      }

      const restored = await e2eeSession.tryRestoreFromStore(
        currentUser.id,
        myKeyDto.keyVersion
      );
      if (!cancelled) {
        dispatch(
          setE2eeState({
            status: restored ? "ready" : "locked",
            keyVersion: myKeyDto.keyVersion,
          })
        );
      }
    }

    syncKeyStatus();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser?.id, isSuccess, myKeyDto, dispatch]);

  if (!isAuthenticated) return null;

  return (
    <>
      <E2eeSetupModal />
      <E2eeUnlockModal />
    </>
  );
}

