import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "../../services/api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const { t, i18n } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLanguageToggle = () => {
    const newLang = i18n.language === "en" ? "si" : "en";
    i18n.changeLanguage(newLang);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (!password || !confirmPassword) {
      setError(t("resetPassword.fillAllFields"));
      return;
    }

    if (password.length < 5) {
      setError(t("resetPassword.passwordMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("resetPassword.passwordMismatch"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/auth/reset-password/${token}`,
        { password, confirmPassword }
      );

      if (response.data.success) {
        setIsSuccess(true);
        setMessage(response.data.message);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || t("resetPassword.somethingWrong")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen
  if (isSuccess) {
    return (
      <div style={styles.container}>
        {/* Language Toggle Button */}
        <div style={styles.langWrapper}>
          <button onClick={handleLanguageToggle} style={styles.langButton}>
            {i18n.language === "en" ? "🇱🇰 සිංහල" : "🇬🇧 English"}
          </button>
        </div>

        <div style={styles.card}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "60px", margin: "10px 0" }}>✅</p>
            <h2 style={{ color: "#16a34a" }}>
              {t("resetPassword.successTitle")}
            </h2>
            <p style={{ color: "#374151", margin: "15px 0" }}>{message}</p>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              {t("resetPassword.redirecting")}
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{
                ...styles.button,
                background: "#1e40af",
                marginTop: "20px",
                cursor: "pointer",
              }}
            >
              {t("resetPassword.goToLogin")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Language Toggle Button */}
      <div style={styles.langWrapper}>
        <button onClick={handleLanguageToggle} style={styles.langButton}>
          {i18n.language === "en" ? "🇱🇰 සිංහල" : "🇬🇧 English"}
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>{t("resetPassword.title")}</h2>
        <p style={styles.subtitle}>{t("resetPassword.subtitle")}</p>

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={styles.label}>
              {t("resetPassword.newPasswordLabel")}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder={t("resetPassword.newPasswordPlaceholder")}
                style={{
                  ...styles.input,
                  paddingRight: "40px",
                  border: error
                    ? "2px solid #ef4444"
                    : "1px solid #d1d5db",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={styles.label}>
              {t("resetPassword.confirmPasswordLabel")}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                style={{
                  ...styles.input,
                  paddingRight: "40px",
                  border: error
                    ? "2px solid #ef4444"
                    : "1px solid #d1d5db",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={styles.eyeButton}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {error && <p style={styles.errorText}>⚠️ {error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              background: isLoading ? "#93c5fd" : "#1e40af",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading
              ? t("resetPassword.resetting")
              : t("resetPassword.resetButton")}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            color: "#6b7280",
          }}
        >
          {t("resetPassword.rememberPassword")}{" "}
          <Link to="/login" style={styles.link}>
            {t("resetPassword.loginHere")}
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f0f9ff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  langWrapper: {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: 1000,
  },
  langButton: {
    padding: "8px 16px",
    background: "#1e40af",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    transition: "background 0.3s ease",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "40px",
    width: "100%",
    maxWidth: "450px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    color: "#1e40af",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#6b7280",
    textAlign: "center",
    marginBottom: "25px",
    fontSize: "14px",
  },
  label: {
    fontWeight: "600",
    color: "#374151",
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
  },
  button: {
    width: "100%",
    padding: "12px",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
  },
  link: {
    color: "#1e40af",
    fontWeight: "600",
    textDecoration: "none",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "12px",
    marginTop: "5px",
  },
};

export default ResetPassword;