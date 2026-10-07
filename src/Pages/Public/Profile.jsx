import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import HomeNavBar from "../../components/HomeNavBar";
import api, { apiUrl } from "../../services/api";
import { useTranslation } from "react-i18next";
import {
  FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt,
  FaCamera, FaCheckCircle, FaTimesCircle,
  FaAnchor, FaShip, FaCompass
} from "react-icons/fa";
import { LockKeyhole, Pencil, Save, ShieldCheck, X } from "lucide-react";


const ROLE = {
  owner: { icon: <FaShip />, label: "Boat Owner", badge: "bg-green-100 text-green-700 border-green-200" },
  driver: { icon: <FaCompass />, label: "Boat Driver", badge: "bg-teal-100 text-teal-700 border-teal-200" },
};

const Profile = () => {
  const { t } = useTranslation();
  const { user, login, token } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const coverRef = useRef(null);
  const [uploading, setUploading] = useState({ profile: false, cover: false });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [editingFields, setEditingFields] = useState({});
  const [profileData, setProfileData] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    nic: user?.nic || "",
    address: user?.address || "",
  }));
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-white">
      <FaAnchor className="text-sky-500 text-3xl animate-pulse" />
    </div>
  );

  const role = ROLE[user.role] || ROLE.driver;

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((current) => ({ ...current, [name]: value }));
  };

  const handleFieldCancel = (name) => {
    setProfileData((current) => ({ ...current, [name]: user[name] || "" }));
    setEditingFields((current) => ({ ...current, [name]: false }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put("/auth/profile", profileData);
      if (!data.success || !data.user) {
        throw new Error(data.message || "Could not save your profile.");
      }
      login({ user: { ...user, ...data.user }, token });
      setProfileData({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        nic: data.user.nic || "",
        address: data.user.address || "",
      });
      setEditingFields({});
      showMsg("success", data.message || "Profile saved successfully.");
    } catch (error) {
      showMsg("error", error.response?.data?.message || error.message || "Could not save your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMsg("error", "The new passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const { data } = await api.put("/auth/change-password", passwordData);
      showMsg("success", data.message || "Password updated successfully.");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      showMsg("error", error.response?.data?.message || "Could not update your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpload = async (file, type) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showMsg("error", t("profile.upload.maxSize"));
      return;
    }
    if (!file.type.startsWith("image/")) {
      showMsg("error", t("profile.upload.selectImage"));
      return;
    }
    setUploading((p) => ({ ...p, [type]: true }));
    const formData = new FormData();
    formData.append(type === "profile" ? "profilePicture" : "coverPhoto", file);
    try {
      const res = await api.post(
        `/auth/upload-${type === "profile" ? "profile-picture" : "cover-photo"}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      if (!res.data.success || !res.data.user) {
        throw new Error(res.data.message || t("profile.upload.failed"));
      }
      login({ user: { ...user, ...res.data.user }, token });
      showMsg("success", type === "profile" ? t("profile.upload.profileSuccess") : t("profile.upload.coverSuccess"));
    } catch (err) {
      showMsg("error", err.response?.data?.message || t("profile.upload.failed"));
    } finally {
      setUploading((p) => ({ ...p, [type]: false }));
    }
  };

  const handleFileSelection = (event, type) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleUpload(file, type);
  };

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "N/A";

  return (
    <div data-tour="profile-page" className="min-h-screen bg-slate-50">
      <HomeNavBar />


      {/* Clean Toast */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-24 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {message.type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">Account & identity</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage your registration details, profile photos, and sign-in security.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          <aside className="space-y-6 border-b border-slate-200 pb-7 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <section aria-labelledby="account-overview-heading" className="space-y-4">
              <h2 id="account-overview-heading" className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Account overview
              </h2>
              <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-cyan-100 ring-4 ring-white shadow-sm">
                  {user.profilePicture ? (
                    <img src={apiUrl(user.profilePicture)} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-cyan-700">
                      <FaUser className="text-3xl" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => profileRef.current?.click()}
                  disabled={uploading.profile}
                  aria-label="Change profile photo"
                  title="Change profile photo"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-cyan-700 text-white transition hover:bg-cyan-800 disabled:opacity-60"
                >
                  {uploading.profile ? <Spinner small /> : <FaCamera size={12} />}
                </button>
                <input
                  type="file"
                  ref={profileRef}
                  onChange={(event) => handleFileSelection(event, "profile")}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  aria-label="Upload profile photo"
                />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-900">{user.name}</h2>
                <p className="truncate text-sm text-slate-600">{user.email}</p>
                <p className="mt-1 text-xs text-slate-500">Member since {memberSince}</p>
              </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-800">
                  {role.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{t("profile.accountType")}</p>
                  <p className="truncate text-sm font-semibold text-slate-800">{t(`profile.roles.${user.role}`) || role.label}</p>
                </div>
                <span className={`ml-auto shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${role.badge}`}>
                  {t("profile.active")}
                </span>
              </div>
            </section>

            <section aria-labelledby="photos-heading" className="space-y-3 border-t border-slate-200 pt-5">
              <h2 id="photos-heading" className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Profile photos
              </h2>
              <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">Cover photo</p>
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  disabled={uploading.cover}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-800 hover:text-cyan-950 disabled:opacity-60"
                >
                  {uploading.cover ? <Spinner small /> : <FaCamera size={12} />}
                  {uploading.cover ? "Uploading..." : t("profile.cover.changeCover")}
                </button>
                <input
                  type="file"
                  ref={coverRef}
                  onChange={(event) => handleFileSelection(event, "cover")}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  aria-label="Upload cover photo"
                />
              </div>
              <div className="h-24 overflow-hidden rounded-lg bg-gradient-to-r from-cyan-700 to-sky-500">
                {user.coverPhoto ? (
                  <img src={apiUrl(user.coverPhoto)} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center gap-5 text-white/50">
                    <FaAnchor className="text-2xl" />
                    <FaShip className="text-4xl" />
                    <FaAnchor className="text-2xl" />
                  </div>
                )}
              </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => navigate(user.role === "owner" ? "/boatownerdashboard" : "/boatdriverdashboard")}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-900"
            >
              {role.icon} {t("profile.buttons.dashboard")}
            </button>
          </aside>

          <div className="min-w-0 space-y-9">
            <section aria-labelledby="registration-heading">
              <div className="mb-6">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-800">Personal information</p>
                <h2 id="registration-heading" className="text-2xl font-semibold tracking-tight text-slate-900">Registration details</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Review your details and edit any field that needs an update.</p>
              </div>

            <form onSubmit={handleProfileSave} className="space-y-5">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <ProfileField
                  label={t("profile.info.fullName")}
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  icon={<FaUser />}
                  editing={editingFields.name}
                  onEdit={() => setEditingFields((current) => ({ ...current, name: true }))}
                  onCancel={() => handleFieldCancel("name")}
                  required
                  minLength={2}
                  maxLength={50}
                />
                <ProfileField
                  label={t("profile.info.email")}
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  icon={<FaEnvelope />}
                  editing={editingFields.email}
                  onEdit={() => setEditingFields((current) => ({ ...current, email: true }))}
                  onCancel={() => handleFieldCancel("email")}
                  required
                />
                <ProfileField
                  label={t("profile.info.phone")}
                  name="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  icon={<FaPhone />}
                  editing={editingFields.phone}
                  onEdit={() => setEditingFields((current) => ({ ...current, phone: true }))}
                  onCancel={() => handleFieldCancel("phone")}
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                />
                <ProfileField
                  label={t("profile.info.nic")}
                  name="nic"
                  value={profileData.nic}
                  onChange={handleProfileChange}
                  icon={<FaIdCard />}
                  editing={editingFields.nic}
                  onEdit={() => setEditingFields((current) => ({ ...current, nic: true }))}
                  onCancel={() => handleFieldCancel("nic")}
                  required
                  inputMode="numeric"
                  pattern="[0-9]{12}"
                  maxLength={12}
                />
                <ProfileField
                  label={t("profile.info.address")}
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  icon={<FaMapMarkerAlt />}
                  editing={editingFields.address}
                  onEdit={() => setEditingFields((current) => ({ ...current, address: true }))}
                  onCancel={() => handleFieldCancel("address")}
                  required
                  className="sm:col-span-2"
                />
              </div>

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
                <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  Account type cannot be changed here because it controls your access.
                </p>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-800 px-5 text-sm font-semibold text-white transition hover:bg-cyan-900 disabled:cursor-wait disabled:opacity-60"
                >
                  {savingProfile ? <Spinner small /> : <Save size={16} />}
                  {savingProfile ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
            </section>

            <section id="password" aria-labelledby="password-heading" className="scroll-mt-24 border-t border-slate-200 pt-7">
              <div className="mb-6">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-800">Security</p>
                <div className="flex items-center gap-2">
                  <LockKeyhole size={19} className="text-cyan-800" />
                  <h2 id="password-heading" className="text-2xl font-semibold tracking-tight text-slate-900">Change password</h2>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">Confirm your current password and choose a new one.</p>
              </div>
              <form onSubmit={handlePasswordSave} className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <PasswordField
                    label="Current password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                  />
                  <PasswordField
                    label="New password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <PasswordField
                    label="Confirm new password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
                  >
                    {savingPassword ? <Spinner small /> : <LockKeyhole size={16} />}
                    {savingPassword ? "Updating..." : "Update password"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

function ProfileField({
  label,
  name,
  value,
  onChange,
  icon,
  className = "",
  hint,
  editing = false,
  onEdit,
  onCancel,
  ...inputProps
}) {
  return (
    <div className={`block ${className}`}>
      <span className="mb-2 flex min-h-5 items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-slate-600">
        <span className="flex items-center gap-2">
          <span className="text-cyan-700">{icon}</span>
          {label}
        </span>
        {editing ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-[11px] font-semibold normal-case tracking-normal text-slate-500 hover:text-slate-800"
          >
            <X size={13} /> Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-[11px] font-semibold normal-case tracking-normal text-cyan-800 hover:text-cyan-950"
          >
            <Pencil size={12} /> Edit
          </button>
        )}
      </span>
      {editing ? (
        <input
          name={name}
          aria-label={label}
          value={value}
          onChange={onChange}
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
          {...inputProps}
        />
      ) : (
        <p className="flex min-h-11 items-center border-b border-slate-200 px-1 text-sm text-slate-800">
          {value || <span className="text-slate-400">Not provided</span>}
        </p>
      )}
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

function PasswordField({ label, name, value, onChange, hint, compact = false, ...inputProps }) {
  return (
    <label className="block">
      <span className={`block font-bold uppercase tracking-wider text-slate-600 ${compact ? "mb-1 text-[10px]" : "mb-2 text-xs"}`}>{label}</span>
      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        required
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 ${compact ? "h-9" : "min-h-11 px-3"}`}
        {...inputProps}
      />
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const Spinner = ({ small }) => (
  <div className={`${small ? "w-3 h-3" : "w-4 h-4"} border-2 border-current border-t-transparent rounded-full animate-spin`} />
);

export default Profile;