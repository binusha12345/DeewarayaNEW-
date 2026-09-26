import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "../../services/api";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleLanguageToggle = () => {
    const newLang = i18n.language === "en" ? "si" : "en";
    i18n.changeLanguage(newLang);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError(t("forgotPassword.emailRequired"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/auth/forgot-password`,
        { email: email.trim() }
      );

      if (response.data.success) {
        setIsEmailSent(true);
        setMessage(response.data.message);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || t("forgotPassword.somethingWrong")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen
  if (isEmailSent) {
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
            <p style={{ fontSize: "60px", margin: "10px 0" }}>📧</p>
            <h2 style={{ color: "#16a34a", marginBottom: "15px" }}>
              {t("forgotPassword.checkEmail")}
            </h2>
            <p style={{ color: "#374151", marginBottom: "10px" }}>{message}</p>

            <div style={styles.infoBox}>
              <p style={{ margin: "5px 0", color: "#1e40af" }}>
                📬 <strong>{email}</strong>
              </p>
              <p
                style={{
                  margin: "5px 0",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                ⏰{" "}
                {t("forgotPassword.linkExpires", { minutes: 15 })}
              </p>
            </div>

            <p
              style={{
                color: "#6b7280",
                fontSize: "13px",
                marginTop: "15px",
              }}
            >
              💡 {t("forgotPassword.checkSpam")}
            </p>

            <Link
              to="/login"
              style={{
                ...styles.button,
                display: "block",
                textDecoration: "none",
                marginTop: "20px",
                background: "#1e40af",
              }}
            >
              {t("forgotPassword.backToLogin")}
            </Link>
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
        <h2 style={styles.title}>{t("forgotPassword.title")}</h2>
        <p style={styles.subtitle}>{t("forgotPassword.subtitle")}</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={styles.label}>
              {t("forgotPassword.emailLabel")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder={t("forgotPassword.emailPlaceholder")}
              style={{
                ...styles.input,
                border: error
                  ? "2px solid #ef4444"
                  : "1px solid #d1d5db",
              }}
            />
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
              ? t("forgotPassword.sending")
              : t("forgotPassword.sendResetLink")}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            color: "#6b7280",
          }}
        >
          {t("forgotPassword.rememberPassword")}{" "}
          <Link to="/login" style={styles.link}>
            {t("forgotPassword.loginHere")}
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
  button: {
    width: "100%",
    padding: "12px",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    textAlign: "center",
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
  infoBox: {
    background: "#dbeafe",
    padding: "12px",
    borderRadius: "6px",
    marginTop: "15px",
  },
};

export default ForgotPassword;