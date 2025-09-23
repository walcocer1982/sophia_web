import { auth } from "@/lib/auth"
import { Header } from "@/components/header"
import { LessonsClient } from "./lessons-client"

export default async function LessonsPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header session={session} />
      <LessonsClient />
    </div>
  )
}