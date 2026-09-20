import { auth } from "@/src/auth"

export default async function Wallet() {
  const session = await auth()
  return (
    <div>
      <h1>Welcome citizen</h1>
      <p>Welcome, {session?.user?.name}</p>
      <p>Role: {session?.role}</p>
    </div>
  )
}