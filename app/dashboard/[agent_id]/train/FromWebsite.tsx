import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";


type FromWebsiteProps = {
    singleUrl: string;
    setSingleUrl: (url: string) => void;
    baseUrl: string;
    setBaseUrl: (url: string) => void;
    limit: number;
    setLimit: (limit: number) => void;
    includeSubdomains: boolean;
    setIncludeSubdomains: (include: boolean) => void;
    followExternalLinks: boolean;
    setFollowExternalLinks: (follow: boolean) => void;
    exclusionPatterns: string;
    setExclusionPatterns: (patterns: string) => void;
    crawlDepth: number;
    setCrawlDepth: (depth: number) => void;
    handleSingleSubmit: () => void;
    handleCrawlSubmit: () => void;
    agentId:string
}

const FromWebsite = ({
    singleUrl,
    setSingleUrl,
    baseUrl,
    setBaseUrl,
    limit,
    setLimit,
    includeSubdomains,
    setIncludeSubdomains,
    followExternalLinks,
    setFollowExternalLinks,
    exclusionPatterns,
    setExclusionPatterns,
    crawlDepth,
    setCrawlDepth,
    handleSingleSubmit,
    handleCrawlSubmit,
    agentId
}: FromWebsiteProps) => {

    
    return (
        <Card className="flex-1 p-6 sm:p-10 mx-auto shadow-xl rounded-2xl border bg-background max-w-2xl">
            <CardHeader className="pb-6 text-center">
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                    Add Your Website 🕸️
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                    Choose how you want to provide your website content for the chatbot.
                </p>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="single" className="w-full">
                    {/* Tabs Nav */}
                    <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-lg shadow-sm">
                        <TabsTrigger
                            value="single"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground rounded-md transition-all duration-200"
                        >
                            Single Page
                        </TabsTrigger>
                        <TabsTrigger
                            value="crawl"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground rounded-md transition-all duration-200"
                        >
                            Crawl Website
                        </TabsTrigger>
                    </TabsList>

                    {/* Single Page Tab */}
                    <TabsContent value="single" className="pt-8 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="single-url" className="text-base font-medium">Page URL</Label>
                            <Input
                                id="single-url"
                                type="url"
                                placeholder="https://example.com/about-us"
                                value={singleUrl}
                                onChange={(e) => setSingleUrl(e.target.value)}
                                className="h-10 text-base"
                            />
                            <p className="text-xs text-muted-foreground">
                                Provide the exact URL of the page you want to add.
                            </p>
                        </div>
                        <Button className="w-full py-2 text-lg font-semibold" onClick={handleSingleSubmit}>
                            Add Page ✨
                        </Button>
                    </TabsContent>

                    {/* Crawl Website Tab */}
                    <TabsContent value="crawl" className="pt-8 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="base-url" className="text-base font-medium">Website URL</Label>
                            <Input
                                id="base-url"
                                type="url"
                                placeholder="https://example.com"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="h-10 text-base"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the root URL to start crawling from.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="page-limit" className="text-base font-medium">Page Limit: {limit}</Label>
                            <Input
                                id="page-limit"
                                type="number"
                                min={1}
                                max={1000} 
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="h-10 text-base"
                            />
                           
                            <p className="text-xs text-muted-foreground">
                                Maximum number of pages to crawl.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="crawl-depth" className="text-base font-medium">Crawl Depth: {crawlDepth}</Label>
                            <Input
                                id="crawl-depth"
                                type="number"
                                min={1}
                                max={10} // Reasonable max depth to prevent infinite crawls
                                value={crawlDepth}
                                onChange={(e) => setCrawlDepth(Number(e.target.value))}
                                className="h-10 text-base"
                            />
                            
                           
                            <p className="text-xs text-muted-foreground">
                                How many link levels deep to follow from the base URL.
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="include-subdomains"
                                checked={includeSubdomains}
                                onCheckedChange={setIncludeSubdomains}
                                className="h-5 w-5"
                            />
                            <Label htmlFor="include-subdomains" className="text-base font-medium cursor-pointer">
                                Include Subdomains
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-3 ml-8">
                            Crawl pages like `blog.example.com` in addition to `example.com`.
                        </p>

                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="follow-external-links"
                                checked={followExternalLinks}
                                onCheckedChange={setFollowExternalLinks}
                                className="h-5 w-5"
                            />
                            <Label htmlFor="follow-external-links" className="text-base font-medium cursor-pointer">
                                Follow External Links
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-3 ml-8">
                            Crawl links leading to other websites (use with caution).
                        </p>

                        <div className="space-y-2">
                            <Label htmlFor="exclusion-patterns" className="text-base font-medium">Exclusion Patterns</Label>
                            <Textarea
                                id="exclusion-patterns"
                                placeholder="e.g., /privacy-policy, /terms-of-service, .pdf$"
                                value={exclusionPatterns}
                                onChange={(e) => setExclusionPatterns(e.target.value)}
                                className="min-h-[80px] text-base"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter URL patterns (one per line or comma-separated) to exclude from crawling.
                            </p>
                        </div>

                        <Button className="w-full py-2 text-lg font-semibold" onClick={handleCrawlSubmit}>
                            Start Crawling 🚀
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

export default FromWebsite;