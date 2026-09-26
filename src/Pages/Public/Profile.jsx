import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import HomeNavBar from "../../components/HomeNavBar";
import api, { apiUrl } from "../../services/api";
import { useTranslation } from "react-i18next";
import {
  FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt,
  FaCamera, FaKey, FaCheckCircle, FaTimesCircle,
  FaCalendarAlt, FaAnchor, FaShip, FaCompass
} from "react-icons/fa";


const ROLE = {
  owner: { icon: <FaShip />, label: "Boat Owner", badge: "bg-green-100 text-green-700 border-green-200" },
  driver: { icon: <FaCompass />, label: "Boat Driver", badge: "bg-teal-100 text-teal-700 border-teal-200" },
};

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, login, token } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const coverRef = useRef(null);
  const [uploading, setUploading] = useState({ profile: false, cover: false });
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleLanguageToggle = () => {
    const newLang = i18n.language === "en" ? "si" : "en";
    i18n.changeLanguage(newLang);
  };

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

  const handleUpload = async (file, type) => {
    if (!file || file.size > 5 * 1024 * 1024) return showMsg("error", t("profile.upload.maxSize"));
    if (!file.type.startsWith("image/")) return showMsg("error", t("profile.upload.selectImage"));
    setUploading((p) => ({ ...p, [type]: true }));
    const formData = new FormData();
    formData.append(type === "profile" ? "profilePicture" : "coverPhoto", file);
    try {
      const res = await api.post(
        `/auth/upload-${type === "profile" ? "profile-picture" : "cover-photo"}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        login({ user: res.data.user, token });
        showMsg("success", type === "profile" ? t("profile.upload.profileSuccess") : t("profile.upload.coverSuccess"));
      }
    } catch (err) {
      showMsg("error", err.response?.data?.message || t("profile.upload.failed"));
    } finally {
      setUploading((p) => ({ ...p, [type]: false }));
    }
  };

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "N/A";

  const infoFields = [
    { icon: <FaUser />, label: t("profile.info.fullName"), value: user.name },
    { icon: <FaEnvelope />, label: t("profile.info.email"), value: user.email },
    { icon: <FaPhone />, label: t("profile.info.phone"), value: user.phone },
    { icon: <FaIdCard />, label: t("profile.info.nic"), value: user.nic },
    { icon: role.icon, label: t("profile.info.role"), value: t(`profile.roles.${user.role}`) || role.label },
    { icon: <FaCalendarAlt />, label: t("profile.info.memberSince"), value: memberSince },
  ];

  // Simple, clean animation
  const fadeIn = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  return (
    <div data-tour="profile-page" className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-white">
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

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Main Card - Simple fade */}
        <motion.div {...fadeIn}
          className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-white via-white to-sky-50 border border-sky-100"
        >

          {/* Cover */}
          <div className="h-44 relative group">
            {user.coverPhoto ? (
              <img src={apiUrl(user.coverPhoto)} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-500 flex items-center justify-center gap-8">
                <FaAnchor className="text-white/20 text-5xl" />
                <FaShip className="text-white/20 text-7xl" />
                <FaAnchor className="text-white/20 text-5xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => coverRef.current?.click()}
                disabled={uploading.cover}
                className="bg-white/90 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-white transition-colors"
              >
                {uploading.cover ? <Spinner /> : <FaCamera size={13} />} {t("profile.cover.changeCover")}
              </button>
            </div>
            <input type="file" ref={coverRef} onChange={(e) => handleUpload(e.target.files[0], "cover")} accept="image/*" className="hidden" />
          </div>

          <div className="px-8 pb-8">

            {/* Avatar + Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-6">

              {/* Avatar with subtle fade */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                className="relative w-24 h-24"
              >
                <div className="w-24 h-24 rounded-xl border-4 border-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {user.profilePicture ? (
                    <img src={apiUrl(user.profilePicture)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                      <FaUser className="text-white text-3xl" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => profileRef.current?.click()}
                  disabled={uploading.profile}
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex items-center justify-center shadow-md border-2 border-white transition-colors"
                >
                  {uploading.profile ? <Spinner small /> : <FaCamera size={11} />}
                </button>
                <input type="file" ref={profileRef} onChange={(e) => handleUpload(e.target.files[0], "profile")} accept="image/*" className="hidden" />
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex gap-2 sm:mb-1"
              >
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-sky-50 hover:border-sky-300 transition-all"
                >
                  <FaKey size={11} /> {t("profile.buttons.changePassword")}
                </button>
                <button
                  onClick={() => navigate(user.role === "owner" ? "/BoatOwnerDashboard" : "/BoatDriverDashboard")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 rounded-lg shadow-md shadow-sky-200 transition-all hover:shadow-lg"
                >
                  {role.icon} {t("profile.buttons.dashboard")}
                </button>
              </motion.div>
            </div>

            {/* Name & Email */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-slate-800">{user.name}</h1>
              <p className="text-slate-500 text-sm mt-1">{user.email}</p>
            </motion.div>

            {/* Role Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mt-4 mb-8 p-4 rounded-xl bg-gradient-to-r from-sky-50 via-white to-sky-50 border border-sky-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xl shadow-md shadow-sky-200">
                {role.icon}
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {t("profile.accountType")}
                </p>
                <p className="text-lg font-bold text-slate-800">{t(`profile.roles.${user.role}`) || role.label}</p>
              </div>
              <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${role.badge}`}>
                ● {t("profile.active")}
              </span>
            </motion.div>

            {/* Personal Info Title */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="text-base font-semibold text-slate-800 mb-4"
            >
              {t("profile.personalInfo")}
            </motion.h2>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {infoFields.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.05 }}
                  className="group p-4 rounded-xl bg-gradient-to-br from-white via-sky-50/50 to-sky-100/40 border border-sky-100 hover:shadow-md hover:border-sky-200 transition-all cursor-default"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm shadow-sm shadow-sky-200 group-hover:shadow-md transition-shadow">
                      {f.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        {f.label}
                      </p>
                      <p className="text-sm text-slate-800 font-medium mt-0.5 break-words">
                        {f.value || <span className="text-slate-400 italic">{t("profile.notProvided")}</span>}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Address (Full Width) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1 }}
                className="sm:col-span-2 group p-4 rounded-xl bg-gradient-to-br from-white via-sky-50/50 to-sky-100/40 border border-sky-100 hover:shadow-md hover:border-sky-200 transition-all cursor-default"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm shadow-sm shadow-sky-200 group-hover:shadow-md transition-shadow">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      {t("profile.info.address")}
                    </p>
                    <p className="text-sm text-slate-800 font-medium mt-0.5 break-words">
                      {user.address || <span className="text-slate-400 italic">{t("profile.notProvided")}</span>}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="text-center text-slate-500 text-xs mt-6 flex items-center justify-center gap-2"
        >
          <FaAnchor /> {t("profile.footer")} <FaAnchor />
        </motion.p>
      </div>
    </div>
  );
};

const Spinner = ({ small }) => (
  <div className={`${small ? "w-3 h-3" : "w-4 h-4"} border-2 border-current border-t-transparent rounded-full animate-spin`} />
);

export default Profile;