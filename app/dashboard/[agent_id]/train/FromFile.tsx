"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { UploadCloud, Loader2, FileSearch2, Trash2 } from "lucide-react"
import { FileText, FileType2, FilePlus2, File } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"



import { useParams } from 'next/navigation' 

import { Toaster, toast } from "sonner"
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

export type FileData = {
  size: number;
  id: string; 
  fileName: string
  fileType: string
  content: string
}

type FromFileProps = {
  filesData: FileData[]
  setFilesData: React.Dispatch<React.SetStateAction<FileData[]>>
}

const FromFile = ({ filesData, setFilesData }: FromFileProps) => {

  const params = useParams();
  const agentId = params.agent_id as string | undefined;

  // Helper function to get the appropriate icon for a file type
  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />
    if (type.includes("word")) return <FileType2 className="w-5 h-5 text-blue-500" />
    if (type.includes("plain")) return <FilePlus2 className="w-5 h-5 text-gray-500" />
    return <File className="w-5 h-5 text-muted-foreground" />
  }

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false); 
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null); 
  const [search, setSearch] = useState("");

  // Filter files based on search input
const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const filteredFiles = filesData.filter(
  (file) =>
    allowedTypes.includes(file.fileType) &&
    file.fileName.toLowerCase().includes(search.toLowerCase())
);

console.log({filteredFiles})


  // Function to extract text from a file via your API endpoint
const extractFileViaAPI = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch("/api/extract-text", {
    method: "POST",
    body: formData,
  })

  const result = await res.json()

  if (!res.ok || !result.success) {
    throw new Error(result.message || "Failed to extract file")
  }

  return {
    fileName: result.data.name as string,
    fileType: result.data.type as string,
    content: result.data.content as string,
    size: file.size, 
  }
}


const onDrop = useCallback(
  async (acceptedFiles: File[]) => {
    if (!agentId) {
      console.error("Agent ID not found in URL. Cannot save files.")
      toast.error("Agent ID missing. Cannot save files.")
      return
    }

    setLoading(true)

    try {
      const extracted = await Promise.all(
        acceptedFiles.map((file) => extractFileViaAPI(file))
      )

      const successfullySavedFiles: FileData[] = []
      let allSavedSuccessfully = true

      for (const file of extracted) {
        try {
          const res = await fetch("/api/agent-files", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              agentId,
              fileName: file.fileName,
              fileType: file.fileType,
              content: file.content,
              size: file.size,
            }),
          })

          if (!res.ok) throw new Error("Failed to save file")

          const createdFile = await res.json()

          successfullySavedFiles.push({
            id: createdFile._id,
            fileName: createdFile.fileName ?? "",
            fileType: createdFile.fileType ?? "",
            content: createdFile.content ?? "",
            size: createdFile.size,
          })
        } catch (saveError) {
          console.error(`Error saving ${file.fileName}:`, saveError)
          allSavedSuccessfully = false
          toast.error(`Failed to save ${file.fileName}`)
        }
      }

      setFilesData((prev) => [...prev, ...successfullySavedFiles])

      if (successfullySavedFiles.length > 0 && allSavedSuccessfully) {
        toast.success("All new files uploaded and saved successfully!")
      } else if (successfullySavedFiles.length > 0 && !allSavedSuccessfully) {
        toast.warning("Some files were uploaded successfully, but others failed.")
      } else if (acceptedFiles.length > 0 && extracted.length === 0) {
        toast.error("Failed to extract any files.")
      } else {
        toast.info("No new files were uploaded.")
      }
    } catch (err) {
      console.error("Extraction or save error:", err)
      toast.error("An error occurred during file extraction or saving.")
    } finally {
      setLoading(false)
    }
  },
  [setFilesData, agentId]
)

  // Function to handle file deletion
 const handleDeleteFile = useCallback(
  async (fileId: string, fileName: string) => {
    if (!agentId) {
      console.error("Agent ID not found. Cannot delete file.")
      toast.error("Agent ID missing. Cannot delete file.")
      return
    }

    setDeletingFileId(fileId) // UI loading indicator

    try {
      const res = await fetch(`/api/agent-files/${fileId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error(`Failed to delete file: ${fileName}`)
      }

      // Remove file from UI list
      setFilesData((prev) => prev.filter((file) => file.id !== fileId))

      toast.success(`"${fileName}" deleted successfully!`)
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error)
      toast.error(`Failed to delete "${fileName}".`)
    } finally {
      setDeletingFileId(null)
    }
  },
  [setFilesData, agentId]
)



  // react-dropzone hook for drag-and-drop functionality
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 5,
  })

  return (
    <div className="flex-1">
      <div className="relative flex-1 space-y-4 p-10 border-1 border-solid rounded-md mb-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Files</h2>
          <p className="text-sm text-muted-foreground">
            Upload various document types to train your AI agent.
          </p>
        </div>

        {/* Dropzone area */}
        <Card
          {...getRootProps()}
          className={`border-dashed border-2 transition-colors cursor-pointer h-48 flex flex-col items-center justify-center text-center gap-2 ${
            isDragActive ? "border-primary" : "border-muted hover:border-primary"
          }`}
        >
          <input {...getInputProps()} />
          <CardContent className="flex flex-col items-center justify-center text-center gap-2">
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Drag & drop</span> files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Supported File Types: .pdf, .doc, .docx, .txt
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          If you are uploading a PDF, make sure it contains selectable text.
        </p>

        {/* Loading indicator for new uploads/extractions */}
        {loading && (
          <Card className="fixed bottom-5 right-5 p-4 bg-background shadow-xl w-64 flex items-center gap-3 border-muted">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Saving file(s)...</span>
          </Card>
        )}
      </div>

      {/* Display uploaded files if any, or initial loading indicator */}
      {initialLoading ? (
        <Card className="p-6 bg-background shadow-xl w-full flex items-center gap-3 border-muted justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading existing files...</span>
        </Card>
      ) : (
        filesData.length > 0 && (
          <div className="border rounded-xl divide-y divide-muted shadow-sm">
            <section className="space-y-6 mt-6">
              {/* Title & Search for files */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6 border-b-1 pb-10">
                <h2 className="text-2xl font-semibold text-foreground">📁 File Sources</h2>
                <div className="relative w-full sm:max-w-sm">
                  <FileSearch2 className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by filename..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* List of filtered files */}
              <div className="border-bottom rounded-xl divide-y divide-muted shadow-sm bg-background">
  {filteredFiles.length > 0 ? (
    filteredFiles.map((file) => (
      <div
        key={file.id}
        className="flex gap-4 p-5 hover:bg-muted/30 transition-colors justify-between items-start"
      >
        {/* Left: Icon + Text */}
        <div className="flex gap-4 flex-1">
          {/* File Icon */}
          <div className="pt-1">{getFileIcon(file.fileType)}</div>

          {/* File Info */}
          <div className="flex flex-col">
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-sm font-medium text-foreground">
                {file.fileName}
              </h3>
              {file.size && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {formatFileSize(file.size)}
                </span>
              )}
            </div>

            <div className="whitespace-pre-wrap text-xs mt-1 max-h-40 overflow-auto text-muted-foreground scrollbar-thin scrollbar-thumb-muted-foreground/30">
  {file.content.slice(0, 500)}...
</div>
          </div>
        </div>

        {/* Right: Delete */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteFile(file.id, file.fileName)}
          className="text-muted-foreground hover:text-red-500"
          aria-label={`Delete ${file.fileName}`}
          disabled={deletingFileId === file.id}
        >
          {deletingFileId === file.id ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </Button>
      </div>
    ))
  ) : (
    <div className="p-6 text-sm text-muted-foreground text-center">
      No matching files found.
    </div>
  )}
</div>

            </section>
          </div>
        )
      )}
      <Toaster />
    </div>
  )
}

export default FromFile
