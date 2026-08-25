import { apiGet, apiPatch, apiPost } from "./client";

export type Admin = {
  id: number;
  fullname: string | null;
  email: string;
  phone: string;
  gender: string | null;
  dob: string | null;
  address: string | null;
  avatar: string | null;
  accountStatus: "active" | "suspended";
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type LoginResult = { tokenExpire: number; admin: Admin };

export const loginWithEmail = (email: string, password: string) =>
  apiPost<LoginResult>("/admin/login/email", { email, password });

export const loginWithGoogle = (idToken: string) =>
  apiPost<LoginResult>("/admin/login/google", { idToken });

export const getMe = () => apiGet<{ admin: Admin }>("/admin/me");

export const logout = () => apiPost("/admin/logout");

export const sendForgotPasswordOtp = (email: string) =>
  apiPost("/admin/forgot-password/send-otp/email", { email });

export const resetPassword = (email: string, emailOtp: string, newPassword: string) =>
  apiPost("/admin/forgot-password/reset/email", { email, emailOtp, newPassword });

export const sendVerificationOtp = (channel: "email" | "phone" | "both" = "both") =>
  apiPost("/admin/verify/send-otp", { channel });

export const verifyOtp = (body: { emailOtp?: string; phoneOtp?: string }) =>
  apiPost<{ admin: Admin }>("/admin/verify/submit-otp", body);

export const updateAdminProfile = (body: {
  fullname?: string;
  gender?: "male" | "female" | "other";
  dob?: string;
  address?: string;
  avatar?: string | null;
}) => apiPatch<{ admin: Admin }>("/admin/profile", body);

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiPatch("/admin/change-password", { currentPassword, newPassword });
