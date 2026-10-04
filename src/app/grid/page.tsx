import { auth } from "@/src/auth"
import ProvisionForm from "@/src/components/ProvisionForm"

export default async function GridPage() {
  const session = await auth()
  return (
    <div>
      <h1>Grid (Admin)</h1>
      <p>Welcome, {session?.user?.name}</p>
      <p>Role: {session?.role}</p>
      <ProvisionForm/>
    </div>
  )
}