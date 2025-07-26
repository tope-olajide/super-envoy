/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/crawl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core'; // Import puppeteer-core
import chrome from 'chrome-aws-lambda'; // Import chrome-aws-lambda
import * as cheerio from 'cheerio';
import { URL } from 'url';

// Define the structure for a crawled page result
interface CrawledPage {
    url: string;
    title?: string;
    content?: string; // Extracted text content
    error?: string;
}

// Helper to calculate rough size of a string in bytes
const roughSizeOfString = (str: string): number => {
    return new TextEncoder().encode(str).length;
};

// Main POST handler for the API route
export async function POST(req: NextRequest) {
    const {
        baseUrl,
        limit = 100,
        includeSubdomains = false,
        followExternalLinks = false,
        exclusionPatterns = '',
        crawlDepth = 3,
        agentId, // Ensure agentId is destructured from the request body
    } = await req.json();

    if (!baseUrl) {
        return NextResponse.json({ error: 'Base URL is required' }, { status: 400 });
    }

    let browser;
    const crawledPages: CrawledPage[] = [];
    const visitedUrls = new Set<string>();
    const urlsToCrawl: { url: string; depth: number }[] = [{ url: baseUrl, depth: 0 }];

    try {
        // --- START CHANGES FOR Puppeteer and chrome-aws-lambda ---
        browser = await puppeteer.launch({
            args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
            defaultViewport: chrome.defaultViewport,
            executablePath: await chrome.executablePath, // Point to the chrome-aws-lambda executable
            headless: chrome.headless, // Use the headless setting from chrome-aws-lambda (true)
        });
        // --- END CHANGES FOR Puppeteer and chrome-aws-lambda ---

        const page = await browser.newPage();

        const exclusionRegexes = exclusionPatterns
            .split(/[\n,]/)
            .map(pattern => pattern.trim())
            .filter(pattern => pattern.length > 0)
            .map(pattern => {
                const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (escapedPattern.includes('*')) {
                    return new RegExp(escapedPattern.replace(/\*/g, '.*'));
                }
                return new RegExp(escapedPattern);
            });

        const baseUrlParsed = new URL(baseUrl);
        const baseUrlHostname = baseUrlParsed.hostname;

        while (urlsToCrawl.length > 0 && crawledPages.length < limit) {
            const currentItem = urlsToCrawl.shift();
            if (!currentItem) continue;

            const { url: currentUrl, depth: currentDepth } = currentItem;

            if (visitedUrls.has(currentUrl) || currentDepth > crawlDepth) {
                continue;
            }

            const isExcluded = exclusionRegexes.some(regex => regex.test(currentUrl));
            if (isExcluded) {
                console.log(`Skipping excluded URL: ${currentUrl}`);
                continue;
            }

            let pageTitle: string | undefined;
            let pageTextContent: string | undefined;

            try {
                visitedUrls.add(currentUrl);
                console.log(`Crawling: ${currentUrl} (Depth: ${currentDepth})`);

                // Ensure the URL is valid before attempting to navigate
                try {
                    new URL(currentUrl); // This will throw if URL is invalid
                } catch (urlError: any) {
                    console.warn(`Invalid URL encountered: ${currentUrl}. Skipping.`);
                    crawledPages.push({ url: currentUrl, error: `Invalid URL: ${urlError.message}` });
                    continue; // Skip to the next URL
                }

                await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                const htmlContent = await page.content();
                const $ = cheerio.load(htmlContent);

                pageTitle = $('title').text().trim() || $('h1').first().text().trim() || 'No Title';
                pageTextContent = $('body').text().trim();

                pageTextContent = pageTextContent.replace(/\s+/g, ' ').replace(/(\s*\n\s*){2,}/g, '\n\n').trim();

                crawledPages.push({
                    url: currentUrl,
                    title: pageTitle,
                    content: pageTextContent,
                });

                // Find all links on the page using Puppeteer's page.evaluate
                const links = await page.evaluate(() => {
                    const anchors = Array.from(document.querySelectorAll('a'));
                    return anchors.map(a => a.href);
                });

                for (const linkHref of links) {
                    try {
                        const nextUrl = new URL(linkHref, currentUrl);
                        const nextUrlString = nextUrl.href;

                        if (visitedUrls.has(nextUrlString)) {
                            continue;
                        }

                        const nextUrlHostname = nextUrl.hostname;

                        const isSameDomain = nextUrlHostname === baseUrlHostname ||
                                            (includeSubdomains && nextUrlHostname.endsWith(`.${baseUrlHostname}`));

                        const isExternalAllowed = followExternalLinks && nextUrlHostname !== baseUrlHostname &&
                                                  !nextUrlHostname.endsWith(`.${baseUrlHostname}`);

                        if ((isSameDomain || isExternalAllowed) &&
                            currentDepth + 1 <= crawlDepth &&
                            !nextUrlString.startsWith('mailto:') &&
                            !nextUrlString.startsWith('tel:')
                        ) {
                            urlsToCrawl.push({ url: nextUrlString, depth: currentDepth + 1 });
                        }
                    } catch (linkError: any) {
                        // console.warn(`Invalid link found on ${currentUrl}: ${linkHref}`, linkError.message);
                    }
                }

            } catch (crawlPageError: any) {
                console.error(`Error crawling ${currentUrl}:`, crawlPageError);
                crawledPages.push({
                    url: currentUrl,
                    error: crawlPageError.message || 'Unknown error during crawl',
                });
            }
        }

        if (!agentId) {
             console.warn("Agent ID not provided in crawl request body. Cannot submit to /api/agent-files.");
             return NextResponse.json(crawledPages);
        }

        const dataToSendToAgentFiles = crawledPages.map(page => ({
            agentId: agentId,
            fileName: page.url,
            fileType: 'website',
            content: page.content || '',
            size: roughSizeOfString(page.content || ''),
        }));

        const agentFilesResponse = await fetch(`${req.nextUrl.origin}/api/agent-files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSendToAgentFiles),
        });

        if (!agentFilesResponse.ok) {
            const agentFilesError = await agentFilesResponse.json();
            console.error('Failed to submit crawled data to /api/agent-files:', agentFilesError);
            return NextResponse.json({
                crawledPages,
                agentFilesError: agentFilesError.error || 'Failed to update agent files'
            }, { status: 500 });
        }

        console.log("Successfully submitted crawled data to /api/agent-files");
        return NextResponse.json(crawledPages);
    } catch (error: any) {
        console.error('Crawler failed (top-level error):', error);
        return NextResponse.json({ error: error.message || 'Crawler internal error' }, { status: 500 });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}