/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { useParams } from "next/navigation"
import { trainAgent } from "@/app/actions/trainAgent" 
import FromFile, { FileData } from "./FromFile"
import FromPlainText from './FromPlainText'
import FromWebsite from "./FromWebsite" 
import FromQA from "./FromQA"
import { toast } from "sonner"


interface CrawledPage {
    url: string;
    title?: string;
    content?: string;
    error?: string;
}

const tabs = ["Files", "Text", "Website", "Q&A"]

// Helper function to simplify file type from MIME type
const getSimplifiedFileType = (mimeType: string): string => {
  if (!mimeType) return "UNKNOWN";
  const lowerCaseMime = mimeType.toLowerCase();

  if (lowerCaseMime.includes("pdf")) return "PDF";
  if (lowerCaseMime.includes("wordprocessingml.document") || lowerCaseMime.includes("msword")) return "DOCX";
  if (lowerCaseMime.includes("spreadsheetml.sheet") || lowerCaseMime.includes("ms-excel")) return "XLSX";
  if (lowerCaseMime.includes("presentationml.presentation") || lowerCaseMime.includes("powerpoint")) return "PPTX";
  if (lowerCaseMime.includes("text/plain")) return "TXT";
  if (lowerCaseMime.includes("image")) return "Image";
  if (lowerCaseMime.includes("audio")) return "Audio";
  if (lowerCaseMime.includes("video")) return "Video";

  // Fallback: try to get the extension if available or just return a generic "File"
  const parts = lowerCaseMime.split('/');
  if (parts.length > 1) {
    const subType = parts[1];
    // Check for common extensions from subtype like "plain", "json", "xml"
    if (subType.includes('.')) {
        return subType.split('.').pop()?.toUpperCase() || subType.toUpperCase();
    }
    // For "application/json" => "JSON"
    return subType.toUpperCase();
  }

  return mimeType.toUpperCase(); // Fallback to original uppercase if no match
};

export default function TrainAgent() {
  const [activeTab, setActiveTab] = useState("Files")

  // State for FromWebsite component
  const [singleUrl, setSingleUrl] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [limit, setLimit] = useState(100) // Default page limit
  const [includeSubdomains, setIncludeSubdomains] = useState(false)
  const [followExternalLinks, setFollowExternalLinks] = useState(false)
  const [exclusionPatterns, setExclusionPatterns] = useState("")
  const [crawlDepth, setCrawlDepth] = useState(3) // Default crawl depth
  const [crawlingLoading, setCrawlingLoading] = useState(false) // For crawling specific loading
  const [crawlError, setCrawlError] = useState<string | null>(null)
  const [crawledData, setCrawledData] = useState<CrawledPage[] | null>(null);
  const [loading, setLoading] = useState(false)



  // State for FromFile and other components that might handle files
  const [filesData, setFilesData] = useState<
    { fileName: string; fileType: string; content: string, size: number, id: string }[]
  >([])


  const params = useParams()
  const agentId = params?.agent_id as string

  const fetchAgentFiles = useCallback(async () => {
    if (!agentId) {
      console.warn("Agent ID not available, skipping initial file fetch.")
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/agent-files?agentId=${agentId}`)
      if (!res.ok) throw new Error("Failed to fetch agent files")

      const agentFiles = await res.json()

      const formattedFiles: FileData[] = agentFiles.map((file: any) => ({
        id: file._id,
        fileName: file.fileName ?? "",
        fileType: file.fileType ?? "",
        content: file.content ?? "",
        size: file.size ?? 0,
      }))

      setFilesData(prev => [...prev, ...formattedFiles])
    } catch (error) {
      console.error("Error fetching agent files:", error)
      toast.error("Failed to load existing files.")
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    fetchAgentFiles()
  }, [agentId, fetchAgentFiles])




  const handleSingleSubmit = async () => {
    setCrawlingLoading(true);
    setCrawlError(null);
    setCrawledData(null); 
    try {
        
        const response = await fetch('/api/crawl-single-page', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: singleUrl })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add single page');
        }

        const data: CrawledPage = await response.json();
     
        console.log("Single URL added:", data);
        setCrawledData([data]); 
        alert("Single page added successfully!");

    } catch (error: any) {
        console.error("Error adding single page:", error);
        setCrawlError(error!.message || "Failed to add single page.");
    } finally {
        setCrawlingLoading(false);
    }
  }

  const handleCrawlSubmit = async () => {
    setCrawlingLoading(true);
    setCrawlError(null);
    setCrawledData(null); 
    try {
        const response = await fetch('/api/crawl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                baseUrl,
                limit,
                includeSubdomains,
                followExternalLinks,
                exclusionPatterns,
                crawlDepth,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to start crawling');
        }

        const data: CrawledPage[] = await response.json();
        console.log("Crawling results:", data);
        setCrawledData(data); // Store results to display or process further
        alert(`Crawling finished! Crawled ${data.length} pages.`);

        // Optionally, integrate crawled data into filesData
        const newFiles = data.map(page => ({
            fileName: page.title || new URL(page.url).pathname.split('/').pop() || 'Untitled Page',
            fileType: 'html', // Or a more specific type if known
            content: page.content || '', 
            size: page.content?.length || 0, // Todo, should be in MB
            id: page.url // Use URL as a unique ID
        }));
        setFilesData(prev => [...prev, ...newFiles]);

    } catch (error: any) {
        console.error("Error during crawling:", error);
        setCrawlError(error.message || "An error occurred during crawling.");
    } finally {
        setCrawlingLoading(false);
    }
  }


  const handleTrainAgent = async () => {
    if (!agentId) {
      alert("Missing agent ID in URL.")
      return
    }
    if (filesData.length === 0) {
        alert("No sources added yet to train the agent. Please add files, text, or crawl a website.")
        return;
    }

    try {
   
      const res = await trainAgent(agentId) 
      if (res.success) {
        alert(`Trained ${res.chunksTrained} chunks successfully`)
      } else {
        alert(`Training failed: ${res.message}`)
      }
    } catch (err) {
      console.error("Training error:", err)
      alert("Something went wrong while training the agent.")
    }
  }


  const groupedFiles = useMemo(() => {
    const groups: { [key: string]: { count: number; totalSize: number } } = {};
    filesData.forEach(file => {
  
      const displayFileType = getSimplifiedFileType(file.fileType);
      if (!groups[displayFileType]) {
        groups[displayFileType] = { count: 0, totalSize: 0 };
      }
      groups[displayFileType].count += 1;
      groups[displayFileType].totalSize += (file.size || 0);
    });
    return groups;
  }, [filesData]);

  // Calculate overall total size
  const overallTotalSize = useMemo(() => {
    return filesData.reduce((sum, file) => sum + (file.size || 0), 0);
  }, [filesData]);

  // Helper function to format bytes to KB or MB for accuracy
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const dm = 1; // Decimal places for better accuracy, e.g., 2.5 KB instead of 2 KB
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Train new Agent</h1>

      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Custom Vertical List */}
        <div className="w-full lg:w-48 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-muted text-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-muted/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area based on activeTab */}
        <div className="flex-1">
   
            {activeTab === "Files" && <FromFile filesData={filesData} setFilesData={setFilesData} />}
            {activeTab === "Text" && <FromPlainText setFilesData={setFilesData} />} {/* Assuming FromPlainText can also add to filesData */}
            {activeTab === "Website" && (
                <FromWebsite
                    singleUrl={singleUrl}
                    setSingleUrl={setSingleUrl}
                    baseUrl={baseUrl}
                    setBaseUrl={setBaseUrl}
                    limit={limit}
                    setLimit={setLimit}
                    includeSubdomains={includeSubdomains}
                    setIncludeSubdomains={setIncludeSubdomains}
                    followExternalLinks={followExternalLinks}
                    setFollowExternalLinks={setFollowExternalLinks}
                    exclusionPatterns={exclusionPatterns}
                    setExclusionPatterns={setExclusionPatterns}
                    crawlDepth={crawlDepth}
                    setCrawlDepth={setCrawlDepth}
                    handleSingleSubmit={handleSingleSubmit}
                    handleCrawlSubmit={handleCrawlSubmit}
                    loading={crawlingLoading} // Pass loading state to disable buttons
                    error={crawlError} // Pass error state for display
                    crawlResults={crawledData} // Pass crawl results for display
                />
            )}
            {/* Add components for Q&A and Notion if you have them */}
            {activeTab === "Q&A" && (<FromQA setFilesData={setFilesData } />)}
{/*             {activeTab === "Notion" && <div>Notion integration content goes here...</div>} */}
        </div>

        {/* Sources and Train Agent Card */}
        <div className="w-full lg:w-64 h-full">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Sources</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Object.keys(groupedFiles).length > 0 ? (
                <>
                  {Object.entries(groupedFiles).map(([fileType, data]) => (
                    <div key={fileType} className="text-sm flex justify-between">
                      <span>{data.count} {fileType}</span>
                      <span className="font-semibold">{formatBytes(data.totalSize)}</span>
                    </div>
                  ))}
                  <div className="border-b border-dashed border-gray-300 my-2"></div>
                  <div className="text-sm flex justify-between">
                    <span>Total size:</span>
                    <span className="font-semibold">{formatBytes(overallTotalSize)}</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">No sources added yet.</div>
              )}

              <Button className="w-full" onClick={handleTrainAgent} disabled={filesData.length === 0}>
                Train agent
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}