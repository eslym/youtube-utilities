import {z} from "zod";

export const VideoDetailsSchema = z.object({
    videoId: z.string(),
    title: z.string(),
    lengthSeconds: z.string(),
    isLive: z.boolean().optional(),
    keywords: z.array(z.string()).optional(),
    channelId: z.string(),
    isOwnerViewing: z.boolean(),
    shortDescription: z.string(),
    isCrawlable: z.boolean(),
    isLiveDvrEnabled: z.boolean().optional(),
    thumbnail: z.object({
        thumbnails: z.array(
            z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
            }),
        ),
    }),
    liveChunkReadahead: z.number().optional(),
    allowRatings: z.boolean(),
    viewCount: z.string(),
    author: z.string(),
    isLowLatencyLiveStream: z.boolean(),
    isPrivate: z.boolean(),
    isUnpluggedCorpus: z.boolean(),
    latencyClass: z.string(),
    isLiveContent: z.boolean(),
});

export const ThumbnailSchema = z.object({
    url: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
});

export const ChannelMetadataSchema = z.object({
    title: z.string(),
    description: z.string(),
    rssUrl: z.string(),
    externalId: z.string(),
    keywords: z.string(),
    ownerUrls: z.array(z.string()),
    avatar: z.object({
        thumbnails: z.array(ThumbnailSchema),
    }),
    channelUrl: z.string(),
    isFamilySafe: z.boolean(),
    availableCountryCodes: z.array(z.string()),
    androidDeepLink: z.string(),
    androidAppindexingLink: z.string(),
    iosAppindexingLink: z.string(),
    vanityChannelUrl: z.string(),
});
