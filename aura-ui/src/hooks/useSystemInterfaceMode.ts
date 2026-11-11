import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setSystemInterfaceMode } from "@/store/slices/uiSlice";
import { watchSystemInterfaceMode } from "@/features/auth/models/InterfaceTheme";

/** Keep device appearance current while preserving the user's explicit preference. */
export function useSystemInterfaceMode() {
  const dispatch = useAppDispatch();
  useEffect(() => watchSystemInterfaceMode((mode) => dispatch(setSystemInterfaceMode(mode))), [dispatch]);
}
