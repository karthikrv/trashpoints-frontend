"use client";

import { firebaseAuth } from "@/src/firebase";
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber, User } from "firebase/auth";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

export default function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // States for tracking backend verification & signup workflow
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          firebaseAuth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {},
            "expired-callback": () => {
              setError("reCAPTCHA expired. Please try again.");
            },
          }
        );
      } catch (err: any) {
        console.error("RecaptchaVerifier initialization failed:", err);
      }
    }
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Step A: Request SMS OTP using updated React.SubmitEvent type
  const handleSendOtp = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
      setError("reCAPTCHA verifier is not initialized.");
      setLoading(false);
      return;
    }

    try {
      const confirmation = await signInWithPhoneNumber(firebaseAuth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setMessage("OTP sent successfully to your phone!");
    } catch (err: any) {
      console.log(err);
      setError(err.message || "Failed to send OTP.");

      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Step B: Verify OTP using updated React.SubmitEvent type
  const handleVerifyOtp = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!confirmationResult) {
      setError("No active session found. Please request a new OTP.");
      setLoading(false);
      return;
    }

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      setFirebaseUser(user);

      const token = await user.getIdToken();

      // Check existence directly first, bypassing authorize()'s null path
      const checkResponse = await fetch(
        `${process.env.NEXT_PUBLIC_TRASHPOINT_BACKEND_URL}users/resolve-consumer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const checkData = await checkResponse.json();

      if (checkData.isAuthorised) {
        // Known existing user — safe to call signIn, authorize() will find them
        const signInResult = await signIn("firebase-consumer", {
          token,
          redirect: false,
        });

        if (signInResult?.ok) {
          setMessage("Successfully logged in!");
          router.push("/wallet");
        } else {
          setError("Login failed. Please try again.");
        }
      } else {
        setIsNewUser(true);
        setMessage("Phone number verified! Please complete your signup information below.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid OTP code or verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step C: Complete Profile Signup using updated React.SubmitEvent type
  const handleSignupSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!firebaseUser) {
      setError("No active Firebase session found.");
      setLoading(false);
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_TRASHPOINT_BACKEND_URL}users/signup-consumer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup registration failed.");
      }

      const signInResult = await signIn("firebase-consumer", {
        token,
        redirect: false,
      });

      if (signInResult?.ok) {
        setMessage("Account created and logged in!");
        router.push("/wallet");
      } else {
        setError("Account created, but login failed. Please try signing in again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Firebase Phone Login</h2>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      {message && <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>}

      {!confirmationResult && !isNewUser && (
        <form onSubmit={handleSendOtp}>
          <label style={{ display: "block", marginBottom: "4px" }}>
            Phone Number (with country code):
          </label>
          <input
            type="tel"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
            required
            disabled={loading}
            style={{ width: "100%", padding: "8px", margin: "8px 0", boxSizing: "border-box" }}
          />
          <button type="submit" disabled={loading} style={{ padding: "10px 20px", cursor: "pointer" }}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {confirmationResult && !isNewUser && (
        <form onSubmit={handleVerifyOtp}>
          <label style={{ display: "block", marginBottom: "4px" }}>
            Enter 6-Digit OTP:
          </label>
          <input
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
            required
            disabled={loading}
            style={{ width: "100%", padding: "8px", margin: "8px 0", boxSizing: "border-box" }}
          />
          <button type="submit" disabled={loading} style={{ padding: "10px 20px", cursor: "pointer" }}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}

      {isNewUser && (
        <form onSubmit={handleSignupSubmit}>
          <h3>Complete Your Profile</h3>
          <p>Verified Phone: <strong>{firebaseUser?.phoneNumber}</strong></p>
          <label style={{ display: "block", marginBottom: "4px" }}>Full Name:</label>
          <input
            type="text"
            placeholder="John Doe"
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
            required
            disabled={loading}
            style={{ width: "100%", padding: "8px", margin: "8px 0", boxSizing: "border-box" }}
          />
          <button type="submit" disabled={loading} style={{ padding: "10px 20px", cursor: "pointer" }}>
            {loading ? "Creating Account..." : "Finish Signup"}
          </button>
        </form>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
}
