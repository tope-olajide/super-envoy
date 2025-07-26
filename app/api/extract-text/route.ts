import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"


import { PDFExtract, PDFExtractOptions } from "pdf.js-extract"
import fs from "fs"
import path from "path"
import mammoth from "mammoth"
import { auth } from "@/app/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // 🔐 Authenticate user
    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // 📨 Get file from form
    const formData = await req.formData()
    const file = formData.get("file") as Blob | null

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 })
    }

    // 🧠 Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileType = file.type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileName = (file as any).name || "uploaded"

    const tempDir = path.join(process.cwd(), "public", "temp-uploads")
    const tempPath = path.join(tempDir, fileName)

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
    fs.writeFileSync(tempPath, buffer)

    // 🧠 Extract text based on type
    let extractedText = ""

    if (fileType === "application/pdf") {
      const pdfExtract = new PDFExtract()
      const options: PDFExtractOptions = {}
      const data = await pdfExtract.extract(tempPath, options)
      extractedText = data.pages.flatMap((page) => page.content.map((c) => c.str)).join(" ")
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword"
    ) {
      const { value } = await mammoth.extractRawText({ path: tempPath })
      extractedText = value
    } else if (fileType === "text/plain") {
      extractedText = fs.readFileSync(tempPath, "utf8")
    } else {
      fs.unlinkSync(tempPath)
      return NextResponse.json({ success: false, message: "Unsupported file type" }, { status: 400 })
    }

    fs.unlinkSync(tempPath)

    // ✅ Return extracted result
    return NextResponse.json({
      success: true,
      message: "Text extracted successfully",
      data: {
        name: fileName,
        type: fileType,
        content: extractedText,
        size: file.size,
      },
    })
  } catch (err) {
    console.error("Extraction error:", err)
    return NextResponse.json(
      { success: false, message: "Failed to extract text" },
      { status: 500 }
    )
  }
}
