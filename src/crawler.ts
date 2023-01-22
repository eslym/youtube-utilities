import type {
    ChannelMetadata,
    VideoDetails, YTInitialData,
    YTInitialPlayerResponse
} from "./types/youtube";
import {FetchError, InvalidURLError, UnsupportedPageError} from "./errors";
import {AxiosError} from "axios";
import {extractObject} from "./util";
import {client} from "./client";
import {DOMWindow, JSDOM} from 'jsdom';

export type CrawlResult = ProfileCrawlResult | VideoCrawlResult;

export interface ProfileCrawlResult {
    type: 'profile',

    metadata: ChannelMetadata
}

export interface VideoCrawlResult {
    type: 'video',
    details: VideoDetails,
    liveAbility?: LiveAbility,

    apiKey?: string,

    clientVersion?: string,
}

export interface LiveAbility {
    schedule?: Date;
    continuations: string[];
}

type ChannelURL = `https://youtube.com/channel/${string}` |
    `https://www.youtube.com/channel/${string}` |
    `https://youtube.com/@${string}` |
    `https://www.youtube.com/@${string}`;

type VideoURL = `https://youtube.com/channel/${string}/live` |
    `https://www.youtube.com/channel/${string}/live` |
    `https://youtube.com/@${string}/live` |
    `https://www.youtube.com/@${string}/live` |
    `https://youtube.com/watch?v=${string}` |
    `https://www.youtube.com/watch?v=${string}` |
    `https://youtube.com/shorts/${string}` |
    `https://www.youtube.com/shorts/${string}` |
    `https://youtube.be/${string}`;

const allowedHosts: Readonly<Record<string, boolean>> = Object.freeze({
    'youtube.com': true,
    'www.youtube.com': true,
    'youtu.be': true,
});

/**
 * Fetch and extract metadata from channel url
 * @param url
 */
export function crawl(url: ChannelURL): Promise<ProfileCrawlResult>;

/**
 * Fetch and extract metadata from video url
 * @param url
 */
export function crawl(url: VideoURL): Promise<VideoCrawlResult>;

/**
 * Try to fetch and extract metadata from a youtube url
 * @param url
 */
export function crawl(url: string): Promise<CrawlResult>;
export async function crawl(url: string): Promise<CrawlResult> {
    let uri = new URL(url);
    if (!allowedHosts[uri.hostname.toLowerCase()]) {
        throw new InvalidURLError('Not youtube link!');
    }
    try {
        let res = await client.get<string>(url);
        let {window} = new JSDOM(res.data);
        let meta = getMetaData(window);
        if (meta.type === 'profile') {
            return extractProfile(window);
        }
        if (meta.type === 'video.other' || (meta.url && meta.url.startsWith('https://www.youtube.com/watch?v='))) {
            return extractVideo(window);
        }
    } catch (e) {
        if (e instanceof AxiosError) {
            throw new FetchError("Error while fetching page", e);
        }
    }
    throw new UnsupportedPageError(`Unsupported page: ${url}`);
}

function extractProfile(window: DOMWindow): ProfileCrawlResult {
    let scriptBlocks = window.document.getElementsByTagName('script');
    for (let script of scriptBlocks) {
        if (script.innerHTML.match(/^\s*var\s+ytInitialData\s*=/)) {
            let initialData = extractObject<YTInitialData>("=", script.innerHTML);
            if (initialData && initialData.result.metadata) {
                return {
                    type: 'profile',
                    metadata: initialData.result.metadata.channelMetadataRenderer,
                };
            }
        }
    }
    throw new Error();
}

function extractVideo(window: DOMWindow): VideoCrawlResult {
    let scriptBlocks = window.document.getElementsByTagName('script');
    let ytInitialPlayerResponse: YTInitialPlayerResponse | undefined = undefined;
    let ytInitialData: YTInitialData | undefined = undefined;
    let ytcfg: Record<string, any> = {};
    for (let script of scriptBlocks) {
        if (script.innerHTML.match(/^\s*var\s+ytInitialPlayerResponse\s*=/)) {
            ytInitialPlayerResponse = extractObject<YTInitialPlayerResponse>("=", script.innerHTML)?.result;
            continue;
        }
        if (script.innerHTML.match(/^\s*var\s+ytInitialData\s*=/)) {
            ytInitialData = extractObject<YTInitialData>("=", script.innerHTML)?.result;
            continue;
        }
        let extract = extractObject<Record<string, any>>("ytcfg.set({", script.innerHTML);
        if (extract) {
            Object.assign(ytcfg, extract.result);
        }
    }
    if (!ytInitialPlayerResponse) {
        throw new Error();
    }
    let result: VideoCrawlResult = {
        type: 'video',
        details: ytInitialPlayerResponse.videoDetails,
    };
    if (ytcfg.INNERTUBE_API_KEY) {
        result.apiKey = ytcfg.INNERTUBE_API_KEY;
    }
    if (ytcfg.INNERTUBE_CONTEXT) {
        result.clientVersion = ytcfg.INNERTUBE_CONTEXT.client.clientVersion;
    }
    if (ytInitialPlayerResponse.playabilityStatus.liveStreamability) {
        result.liveAbility = {continuations: []};
        let streamAbility = ytInitialPlayerResponse.playabilityStatus.liveStreamability.liveStreamabilityRenderer;
        if (streamAbility.offlineSlate) {
            result.liveAbility.schedule = new Date(
                Number.parseInt(streamAbility.offlineSlate.liveStreamOfflineSlateRenderer.scheduledStartTime) * 1000
            );
        }
        if (ytInitialData?.contents.twoColumnWatchNextResults.conversationBar?.liveChatRenderer) {
            let viewSelector = ytInitialData.contents.twoColumnWatchNextResults.conversationBar.liveChatRenderer.header.liveChatHeaderRenderer.viewSelector;
            result.liveAbility.continuations = viewSelector.sortFilterSubMenuRenderer.subMenuItems.map(
                i => i.continuation.reloadContinuationData.continuation
            );
        }
    }
    return result;
}

function getMetaData(window: DOMWindow): { type?: string, url?: string } {
    let url = window.document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content;
    let type = window.document.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content;
    return {type, url};
}
