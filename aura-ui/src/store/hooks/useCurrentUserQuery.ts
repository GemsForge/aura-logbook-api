import { useGetCurrentUserQuery } from "@/store/authApi";
import { useAppSelector } from "@/store/hooks";

export function useCurrentUserQuery() {
  const token = useAppSelector((state) => state.auth.token);

  return useGetCurrentUserQuery(undefined, { skip: !token });
}
