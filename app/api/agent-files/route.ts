import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
import { connectMongoose } from "@/app/lib/mongoose"
import { AgentFile } from "@/app/models/AgentFile"



export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const owner = session?.user?.id

    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoose()

    const body = await req.json()
    const { agentId, fileName, fileType, content, size } = body as {
      agentId: string
      fileName: string
      fileType: string
      content: string
      size: number
    }

    if (!agentId || !fileName || !fileType || !content || !size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const file = await AgentFile.create({
      agentId,
      fileName,
      fileType,
      content,
      size,
      owner,
      trained: false,
    })

    return NextResponse.json(file, { status: 201 })
  } catch (error) {
    console.error("AgentFile creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const owner = session?.user?.id

    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoose()

    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get("agentId")

    if (!agentId) {
      return NextResponse.json({ error: "Missing agentId" }, { status: 400 })
    }

    const files = await AgentFile.find({ agentId, owner }).sort({ createdAt: -1 }).lean()

    return NextResponse.json(files, { status: 200 })
  } catch (error) {
    console.error("AgentFile fetch error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
