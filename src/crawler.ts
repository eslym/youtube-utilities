import type {ChannelMetadata, LiveStreamabilityRenderer, VideoDetails, ViewSelector} from "./types/youtube";
import {FetchError, InvalidURLError, UnsupportedPageError} from "./errors";
import {AxiosError} from "axios";
import {extractObject, extractString} from "./util";
import {ChannelMetadataSchema, VideoDetailsSchema} from "./schema/youtube";
import {client} from "./client";
import getMetaData from "metadata-scraper";

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

export function crawl(url: ChannelURL): Promise<ProfileCrawlResult>;
export function crawl(url: VideoURL): Promise<VideoCrawlResult>;
export function crawl(url: string): Promise<CrawlResult>;
export async function crawl(url: string): Promise<CrawlResult> {
    let uri = new URL(url);
    if (!allowedHosts[uri.hostname.toLowerCase()]) {
        throw new InvalidURLError('Not youtube link!');
    }
    try {
        let res = await client.get(url);
        let meta = await getMetaData({html: res.data});
        if (meta.type === 'profile') {
            return extractProfile(res.data);
        }
        if (meta.type === 'video.other' || (meta.url && meta.url.startsWith('https://www.youtube.com/watch?v='))) {
            return extractVideo(res.data);
        }
    } catch (e) {
        if (e instanceof AxiosError) {
            throw new FetchError("Error while fetching page", e);
        }
    }
    throw new UnsupportedPageError(`Unsupported page: ${url}`);
}

function extractProfile(source: string): ProfileCrawlResult {
    let metadata = extractObject<ChannelMetadata>("channelMetadataRenderer", source);
    if (metadata && ChannelMetadataSchema.safeParse(metadata.result).success) {
        return {
            type: 'profile',
            metadata: metadata.result,
        }
    }
    throw new Error();
}

function extractVideo(source: string): VideoCrawlResult {
    let details = extractVideoDetails(source);
    if(!details){
        throw new Error();
    }
    let result: VideoCrawlResult = {
        type: 'video',
        details
    };
    let findString = extractString(":", source, source.indexOf("INNERTUBE_API_KEY"));
    if(findString){
        result.apiKey = findString.result;
    }
    findString = extractString(":", source, source.indexOf("clientVersion"));
    if(findString){
        result.clientVersion = findString.result;
    }
    let findLive = extractObject<LiveStreamabilityRenderer>("liveStreamabilityRenderer", source);
    if(findLive){
        result.liveAbility = {
            continuations: [],
        };
        let streamAbility = findLive.result;
        if(streamAbility.offlineSlate){
            result.liveAbility.schedule = new Date(
                Number.parseInt(streamAbility.offlineSlate.liveStreamOfflineSlateRenderer.scheduledStartTime) * 1000
            );
        }
        let findViewSelector = extractObject<ViewSelector>("viewSelector", source);
        if(findViewSelector){
            result.liveAbility.continuations = findViewSelector.result.sortFilterSubMenuRenderer.subMenuItems.map(
                i => i.continuation.reloadContinuationData.continuation
            );
        }
    }
    return result;
}

function extractVideoDetails(source: string): VideoDetails | null {
    let details = extractObject<VideoDetails>("videoDetails", source);
    while(details){
        if(VideoDetailsSchema.safeParse(details.result)){
            return details.result;
        }
        details = extractObject("videoDetails", source, details.range[1]);
    }
    return null;
}
