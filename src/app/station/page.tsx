import { auth } from "@/src/auth"

export default async function Partner() {
  const session = await auth()
  return (
    <div>
      <h1>Partner</h1>
      <p>Welcome, {session?.user?.name}</p>
      <p>Role: {session?.role}</p>
    </div>
  )
}