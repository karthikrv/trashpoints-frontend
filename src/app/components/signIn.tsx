"use client";
import { signIn } from "next-auth/react";
export default function SingIn() {
  return (
    <>
      <button onClick={() => signIn("google")}>Sign in</button>
    </>
  )
}