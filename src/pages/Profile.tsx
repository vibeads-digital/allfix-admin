import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAuth, ADMIN_ME_KEY } from "@/hooks/useAdminAuth";
import { changePassword, updateAdminProfile, type Admin } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

function PasswordInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        className="pr-10"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changeMutation = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) =>
      toast.error(err.message, err instanceof ApiError && err.highlight ? { description: err.highlight } : undefined),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation don't match");
      return;
    }
    changeMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit}>
      <SectionCard title="Change password" description="Use a strong password you don't use elsewhere" className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <PasswordInput id="current-password" value={currentPassword} onChange={setCurrentPassword} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput id="new-password" value={newPassword} onChange={setNewPassword} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <PasswordInput id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button type="submit" disabled={changeMutation.isPending}>
            {changeMutation.isPending ? "Updating…" : "Change password"}
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-xs text-success">
      <CheckCircle2 className="size-3.5" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <XCircle className="size-3.5" />
      Not verified
    </span>
  );
}

export function ProfilePage() {
  const { admin, isLoading } = useAdminAuth();

  if (isLoading || !admin) {
    return (
      <>
        <PageHeader title="My Profile" description="Manage your personal account details" />
        <div className="text-sm text-muted-foreground py-12 text-center">Loading…</div>
      </>
    );
  }

  // Keyed on admin.id so the form's local state only resets if the logged-in
  // admin actually changes — not on every cache update (e.g. after saving).
  return <ProfileForm key={admin.id} admin={admin} />;
}

function ProfileForm({ admin }: { admin: Admin }) {
  const queryClient = useQueryClient();

  const [fullname, setFullname] = useState(admin.fullname ?? "");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">(
    (admin.gender as "male" | "female" | "other" | null) ?? "",
  );
  const [dob, setDob] = useState(admin.dob ?? "");
  const [address, setAddress] = useState(admin.address ?? "");
  const [avatar, setAvatar] = useState(admin.avatar ?? "");

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminProfile({
        fullname: fullname.trim() || undefined,
        gender: gender || undefined,
        dob: dob || undefined,
        address: address.trim() || undefined,
        avatar: avatar || null,
      }),
    onSuccess: ({ admin: updated }) => {
      queryClient.setQueryData(ADMIN_ME_KEY, { admin: updated });
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <>
      <PageHeader title="My Profile" description="Manage your personal account details" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Photo" className="lg:col-span-1">
          <div className="space-y-3">
            {avatar && (
              <img
                src={avatar}
                alt=""
                className="size-24 mx-auto rounded-full object-cover border border-border"
              />
            )}
            <div className="space-y-1.5">
              <Label htmlFor="profile-avatar">Photo URL</Label>
              <Input
                id="profile-avatar"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Account" description="Read-only — contact support to change" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <div className="text-sm font-medium">{admin.email}</div>
              <VerifiedBadge verified={admin.emailVerified} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <div className="text-sm font-medium">{admin.phone}</div>
              <VerifiedBadge verified={admin.phoneVerified} />
            </div>
            <div className="space-y-1.5">
              <Label>Account status</Label>
              <div>
                <StatusBadge status={admin.accountStatus === "active" ? "Active" : "Suspended"} />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <form onSubmit={handleSubmit}>
        <SectionCard title="Personal details" description="Visible to other admins" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-fullname">Full name</Label>
              <Input
                id="profile-fullname"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-dob">Date of birth</Label>
              <Input
                id="profile-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender || undefined} onValueChange={(v) => setGender(v as typeof gender)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="profile-address">Address</Label>
              <Textarea
                id="profile-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your address"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </SectionCard>
      </form>

      <PasswordSection />
    </>
  );
}
