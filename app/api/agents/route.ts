import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
import { connectMongoose } from "@/app/lib/mongoose"
import { Agent } from "@/app/models/Agent"



export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 🧠 Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      // Redirect unauthenticated users to sign-in page
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    const owner = session.user.id

    // 🗄️ Connect to MongoDB
    await connectMongoose()

    // 📨 Parse request body
    const body = await req.json()
    const { name, description } = body as {
      name?: string
      description?: string
    }

    if (!name || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 🧠 Create new Agent
    const agent = await Agent.create({
      name,
      description,
      owner,
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error("Error creating agent:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}


export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 🔐 Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    const owner = session.user.id

    // 🧬 Connect to MongoDB
    await connectMongoose()

    // 📦 Fetch all agents for the user
    const agents = await Agent.find({ owner })
      .sort({ createdAt: -1 }) // Optional: newest first
      .lean()

    return NextResponse.json(agents, { status: 200 })
  } catch (error) {
    console.error("Error fetching agents:", error)
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    )
  }
}
