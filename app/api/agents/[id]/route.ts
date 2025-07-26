import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
import { connectMongoose } from "@/app/lib/mongoose"
import { AgentFile } from "@/app/models/AgentFile"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const owner = session?.user?.id

    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoose()

    const file = await AgentFile.findOneAndDelete({ _id: params.id, owner })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "File deleted" }, { status: 200 })
  } catch (error) {
    console.error("AgentFile delete error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
