"use client";

import { useState } from "react";

export default function ProvisionForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("partner");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to provision account.");
      }

      setMessage(`Account created for ${data.name} (${data.role}).`);
      setName("");
      setEmail("");
      setRole("partner");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", padding: "20px", fontFamily: "sans-serif" }}>
      <h3>Provision New Staff Account</h3>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      {message && <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: "4px" }}>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          style={{ width: "100%", padding: "8px", margin: "8px 0" }}
        />

        <label style={{ display: "block", marginBottom: "4px" }}>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          style={{ width: "100%", padding: "8px", margin: "8px 0" }}
        />

        <label style={{ display: "block", marginBottom: "4px" }}>Role:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={loading}
          style={{ width: "100%", padding: "8px", margin: "8px 0" }}
        >
          <option value="partner">Partner</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" disabled={loading} style={{ padding: "10px 20px", cursor: "pointer" }}>
          {loading ? "Creating..." : "Provision Account"}
        </button>
      </form>
    </div>
  );
}