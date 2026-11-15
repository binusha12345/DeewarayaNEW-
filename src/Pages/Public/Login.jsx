import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import api from "../../services/api";
import HomeNavBar from "../../components/HomeNavBar";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

import {
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  staggerContainer,
  hoverScale,
  zoomOut,
} from "../../animations";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await api.post("/auth/login", formData);
      login(res.data);
      navigate(res.data.user?.role === "transport_manager" ? "/transport" : "/");
    } catch (err) {
      setError(err.response?.data?.message || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page h-screen flex flex-col overflow-hidden relative"
      style={{
        backgroundImage: `url(src/assets/login.avif)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <style>{responsiveStyles}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-black/50 z-0"
      />

      <HomeNavBar />

      <div className="login-content relative z-10 flex flex-col-reverse md:flex-row justify-end items-start w-full h-full p-8 gap-8">

        {/* ═══════════ LEFT TEXT ═══════════ */}
        <motion.div
          className="login-left flex-1 flex flex-col justify-center text-white px-6 md:px-16 py-6 md:py-16 text-center md:text-left mt-60"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.h1
            variants={fadeInLeft}
            className="login-heading text-[55px] font-extrabold leading-normal mb-2"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            {t('login.heading1')} <br /> {t('login.heading2')}{" "}
            <motion.span
              className="text-blue-300 inline-block"
              animate={{
                opacity: [1, 0.7, 1],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Deewaraya
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fadeInLeft}
            className="login-subtext text-gray-200 text-[16px] mt-[-10px]"
          >
            {t('login.subtext')}
          </motion.p>
        </motion.div>

        {/*  RIGHT LOGIN CARD */}
        <motion.div
          className="login-card w-[40%] h-auto min-h-[70vh] rounded-2xl p-18 shadow-2xl bg-white/50 backdrop-blur-xl"
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          whileHover={{
            boxShadow: "0 25px 50px -12px rgba(0, 30, 64, 0.4)",
          }}
        >
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="login-title text-[28px] font-extrabold text-[#001e40] mb-1 ml-40"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              {t('login.title')}
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="login-subtitle text-black-500 text-[14px] mb-10 ml-28"
            >
              {t('login.subtitle')}
            </motion.p>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: [0, -10, 10, -10, 10, 0],
                }}
                transition={{ duration: 0.5 }}
                className="mb-4 bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <form data-tour="login-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* EMAIL FIELD */}
              <motion.div variants={fadeInUp}>
                <label className="text-[12px] font-semibold tracking-widest uppercase text-black-500 block mb-2">
                  {t('login.emailLabel')}
                </label>
                <motion.input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('login.emailPlaceholder')}
                  autoComplete="off"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-full bg-white rounded-xl px-4 py-2 text-sm text-black-800 outline-none border-b-2 border-transparent focus:border-[#001e40] transition-all duration-200 placeholder-gray-400 mb-2"
                />
              </motion.div>

              {/* PASSWORD FIELD */}
              <motion.div variants={fadeInUp}>
                <label className="text-[12px] font-semibold tracking-widest uppercase text-black-500 block mb-2">
                  {t('login.passwordLabel')}
                </label>

                <div className="relative">
                  <motion.input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('login.passwordPlaceholder')}
                    autoComplete="new-password"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-full bg-white rounded-xl px-4 py-2 pr-12 text-sm text-black-800 outline-none border-b-2 border-transparent focus:border-[#001e40] transition-all duration-200 placeholder-gray-400"
                  />

                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#001e40] transition-colors duration-200"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </motion.button>
                </div>
              </motion.div>

              {/* SUBMIT BUTTON */}
              <motion.button
                variants={fadeInUp}
                type="submit"
                disabled={loading}
                whileHover={{
                  scale: loading ? 1 : 1.03,
                  boxShadow: "0 10px 30px -5px rgba(30, 58, 138, 0.5)",
                }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                className="w-full bg-blue-900 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    {t('login.loggingIn')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t('login.loginBtn')}
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </span>
                )}
              </motion.button>
            </form>

            {/* Forgot Password link */}
            <motion.div
              variants={fadeInUp}
              style={{ textAlign: "right", marginTop: "5px", marginBottom: "15px" }}
            >
              <motion.div whileHover={{ x: -5 }}>
                <Link
                  to="/forgot-password"
                  data-tour="forgot-password"
                  style={{
                    color: "#1e40af",
                    fontSize: "13px",
                    textDecoration: "none",
                    fontWeight: "500",
                  }}
                >
                  {t('login.forgotPassword')}
                </Link>
              </motion.div>
            </motion.div>

            {/* REGISTER LINK */}
            <motion.p
              variants={fadeInUp}
              className="text-center text-sm text-black-600 mt-2 text-[14px]"
            >
              {t('login.noAccount')}{" "}
              <motion.span
                whileHover={{ scale: 1.1 }}
                className="inline-block"
              >
                <Link to="/register" className="text-blue-900 font-bold hover:underline">
                  {t('login.signUp')}
                </Link>
              </motion.span>
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

const responsiveStyles = `
  .login-page { min-height: 100vh; }

  @media (max-width: 1280px) {
    .login-card { width: 45% !important; padding: 2.5rem !important; min-height: auto !important; }
    .login-heading { font-size: 2.75rem !important; }
    .login-left { margin-top: 10rem !important; }
  }

  @media (max-width: 1024px) {
    .login-card { width: 50% !important; padding: 2rem !important; min-height: auto !important; }
    .login-heading { font-size: 2.25rem !important; line-height: 1.3 !important; }
    .login-subtext { font-size: 0.875rem !important; }
    .login-left { padding-left: 1.5rem !important; padding-right: 1.5rem !important; margin-top: 8rem !important; }
    .login-title { margin-left: 0 !important; text-align: center !important; font-size: 1.5rem !important; }
    .login-subtitle { margin-left: 0 !important; text-align: center !important; margin-bottom: 1.5rem !important; }
  }

  @media (max-width: 768px) {
    .login-page { height: auto !important; min-height: 100vh !important; overflow-y: auto !important; }
    .login-content { flex-direction: column !important; align-items: center !important; justify-content: flex-start !important; padding: 1.5rem !important; padding-top: 6rem !important; gap: 2rem !important; height: auto !important; min-height: calc(100vh - 4rem) !important; }
    .login-card { width: 100% !important; max-width: 480px !important; min-height: auto !important; padding: 2rem 1.75rem !important; margin: 0 auto !important; order: 1 !important; }
    .login-title { margin-left: 0 !important; text-align: center !important; font-size: 1.5rem !important; }
    .login-subtitle { margin-left: 0 !important; text-align: center !important; font-size: 0.8rem !important; margin-bottom: 1.5rem !important; }
    .login-left { order: 2 !important; margin-top: 0 !important; padding: 0 1rem !important; text-align: center !important; flex: none !important; }
    .login-heading { font-size: 1.75rem !important; line-height: 1.3 !important; }
    .login-heading br { display: none !important; }
    .login-subtext { font-size: 0.85rem !important; margin-top: 0.5rem !important; }
  }

  @media (max-width: 640px) {
    .login-content { padding: 1rem !important; padding-top: 5.5rem !important; gap: 1.5rem !important; }
    .login-card { width: 100% !important; max-width: 100% !important; padding: 1.75rem 1.25rem !important; border-radius: 1rem !important; }
    .login-title { font-size: 1.375rem !important; }
    .login-subtitle { font-size: 0.75rem !important; margin-bottom: 1.25rem !important; }
    .login-card input { padding: 0.625rem 0.875rem !important; font-size: 0.875rem !important; }
    .login-card label { font-size: 0.65rem !important; }
    .login-card button[type="submit"] { padding-top: 0.625rem !important; padding-bottom: 0.625rem !important; font-size: 0.9rem !important; }
    .login-heading { font-size: 1.5rem !important; line-height: 1.35 !important; }
    .login-subtext { font-size: 0.8rem !important; }
  }

  @media (max-width: 480px) {
    .login-content { padding: 0.75rem !important; padding-top: 5rem !important; gap: 1rem !important; }
    .login-card { padding: 1.5rem 1rem !important; border-radius: 0.875rem !important; }
    .login-title { font-size: 1.25rem !important; }
    .login-subtitle { font-size: 0.7rem !important; margin-bottom: 1rem !important; }
    .login-card input { padding: 0.5rem 0.75rem !important; font-size: 0.8rem !important; border-radius: 0.625rem !important; }
    .login-card label { font-size: 0.6rem !important; margin-bottom: 0.25rem !important; }
    .login-card button[type="submit"] { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; font-size: 0.85rem !important; }
    .login-card .space-y-4 > * + * { margin-top: 0.75rem !important; }
    .login-heading { font-size: 1.25rem !important; }
    .login-subtext { font-size: 0.75rem !important; }
    .login-card a { font-size: 0.75rem !important; }
    .login-card .text-center.text-sm { font-size: 0.75rem !important; }
  }

  @media (max-width: 360px) {
    .login-content { padding: 0.5rem !important; padding-top: 4.5rem !important; }
    .login-card { padding: 1.25rem 0.75rem !important; }
    .login-title { font-size: 1.125rem !important; }
    .login-card input { padding: 0.5rem 0.625rem !important; font-size: 0.75rem !important; }
    .login-heading { font-size: 1.1rem !important; }
  }
`;

export default Login;