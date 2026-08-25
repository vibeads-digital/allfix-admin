import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api/auth";

export const ADMIN_ME_KEY = ["admin", "me"] as const;

export function useAdminAuth() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ADMIN_ME_KEY,
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });

  return {
    admin: data?.admin ?? null,
    isLoading,
    isAuthenticated: !isLoading && !isError && !!data?.admin,
  };
}
