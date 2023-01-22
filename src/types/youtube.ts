/**
 * APIレスポンスの型
 *
 * @see https://github.com/LinaTsukusu/youtube-chat/blob/develop/src/types/yt-response.ts
 * */

/** get_live_chat Response */
export interface GetLiveChatResponse {
    responseContext: object
    trackingParams?: string
    continuationContents: {
        liveChatContinuation: {
            continuations: Continuation[]
            actions: Action[]
        }
    }
}

export interface Continuation {
    invalidationContinuationData?: {
        invalidationId: {
            objectSource: number
            objectId: string
            topic: string
            subscribeToGcmTopics: boolean
            protoCreationTimestampMs: string
        }
        timeoutMs: number
        continuation: string
    }
    timedContinuationData?: {
        timeoutMs: number
        continuation: string
        clickTrackingParams: string
    }
}

export interface Action {
    markChatItemAsDeletedAction?: MarkChatItemAsDeletedAction

    removeChatItemAction?: {
        targetItemId: string;
    }

    addChatItemAction?: AddChatItemAction
    addLiveChatTickerItemAction?: object
}

export interface Thumbnail {
    url: string;
    width?: number;
    height?: number;
}

export interface MessageText {
    text: string
    bold?: boolean;
    italics?: boolean;
}

export interface MessageEmoji {
    emoji: {
        emojiId: string
        shortcuts: string[]
        searchTerms: string[]
        supportsSkinTone: boolean
        image: {
            thumbnails: Thumbnail[]
            accessibility: {
                accessibilityData: {
                    label: string
                }
            }
        }
        variantIds: string[]
        isCustomEmoji?: true
    }
}

export type MessageRun = MessageText | MessageEmoji

export interface AuthorBadge {
    liveChatAuthorBadgeRenderer: {
        customThumbnail?: {
            thumbnails: Thumbnail[]
        }
        icon?: {
            iconType: string
        }
        tooltip: string
        accessibility: {
            accessibilityData: {
                label: string
            }
        }
    }
}

export interface MessageRendererBase {
    authorName?: {
        simpleText: string
    }
    authorPhoto: {
        thumbnails: Thumbnail[]
    }
    authorBadges?: AuthorBadge[]
    contextMenuEndpoint: {
        clickTrackingParams: string
        commandMetadata: {
            webCommandMetadata: {
                ignoreNavigation: true
            }
        }
        liveChatItemContextMenuEndpoint: {
            params: string
        }
    }
    id: string
    timestampUsec: string
    authorExternalChannelId: string
    contextMenuAccessibility: {
        accessibilityData: {
            label: string
        }
    }
}

export interface LiveChatTextMessageRenderer extends MessageRendererBase {
    message: {
        runs: MessageRun[]
    }
}

export interface LiveChatPaidMessageRenderer extends LiveChatTextMessageRenderer {
    purchaseAmountText: {
        simpleText: string
    }
    headerBackgroundColor: number
    headerTextColor: number
    bodyBackgroundColor: number
    bodyTextColor: number
    authorNameTextColor: number
}

export interface LiveChatPaidStickerRenderer extends MessageRendererBase {
    purchaseAmountText: {
        simpleText: string
    }
    sticker: {
        thumbnails: Thumbnail[]
        accessibility: {
            accessibilityData: {
                label: string
            }
        }
    }
    moneyChipBackgroundColor: number
    moneyChipTextColor: number
    stickerDisplayWidth: number
    stickerDisplayHeight: number
    backgroundColor: number
    authorNameTextColor: number
}

export interface LiveChatMembershipItemRenderer extends MessageRendererBase {
    headerSubtext: {
        runs: MessageRun[]
    } | { simpleText: string; }
    headerPrimaryText: {
        runs: MessageRun[]
    }
    authorBadges: AuthorBadge[]

    message?: {
        runs: MessageRun[];
    }
}

interface LiveChatSponsorshipsHeaderRenderer extends MessageRendererBase {
    primaryText: {
        runs: MessageRun[];
    }
}

export interface LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer {
    header: {
        liveChatSponsorshipsHeaderRenderer: LiveChatSponsorshipsHeaderRenderer;
    };
}

export interface AddChatItemAction {
    item: {
        liveChatTextMessageRenderer?: LiveChatTextMessageRenderer
        liveChatPaidMessageRenderer?: LiveChatPaidMessageRenderer
        liveChatMembershipItemRenderer?: LiveChatMembershipItemRenderer
        liveChatSponsorshipsGiftPurchaseAnnouncementRenderer?: LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer
        liveChatSponsorshipsGiftRedemptionAnnouncementRenderer?: LiveChatTextMessageRenderer
        liveChatPaidStickerRenderer?: LiveChatPaidStickerRenderer
        liveChatViewerEngagementMessageRenderer?: object
    }
    clientId: string
}

interface MarkChatItemAsDeletedAction {
    deletedStateMessage: {
        runs: MessageRun[];
    }
    targetItemId: string;
}

export interface LiveStreamabilityRenderer {
    offlineSlate: {
        liveStreamOfflineSlateRenderer: {
            scheduledStartTime: string;
        }
    }
}

export interface YTInitialPlayerResponse {
    playabilityStatus: {
        liveStreamability?: {
            liveStreamabilityRenderer: LiveStreamabilityRenderer
        }
    }
    videoDetails: VideoDetails;
}

export interface YTInitialData {
    contents: {
        twoColumnWatchNextResults: {
            conversationBar?: {
                liveChatRenderer?: {
                    header: {
                        liveChatHeaderRenderer: {
                            viewSelector: ViewSelector;
                        }
                    }
                }
            }
        }
    }
    metadata?: {
        channelMetadataRenderer: ChannelMetadata
    }
}

interface SubMenuItem {
    continuation: {
        reloadContinuationData: {
            continuation: string;
        }
    }
}

export interface ViewSelector {
    sortFilterSubMenuRenderer: {
        subMenuItems: SubMenuItem[];
    }
}

export interface VideoDetails {
    videoId: string;
    title: string;
    lengthSeconds: string;
    isLive?: boolean;
    keywords?: string[];
    channelId: string;
    isOwnerViewing: boolean;
    shortDescription: string;
    isCrawlable: boolean;
    isLiveDvrEnabled?: boolean;
    thumbnail: {
        thumbnails: Thumbnail[];
    };
    liveChunkReadahead?: number;
    allowRatings: boolean;
    viewCount: string;
    author: string;
    isLowLatencyLiveStream: boolean;
    isPrivate: boolean;
    isUnpluggedCorpus: boolean;
    latencyClass: string;
    isLiveContent: boolean;
}

export interface ChannelMetadata {
    title: string;
    description: string;
    rssUrl: string;
    externalId: string;
    keywords: string;
    ownerUrls: string[];
    avatar: {
        thumbnails: Thumbnail[];
    };
    channelUrl: string;
    isFamilySafe: boolean;
    availableCountryCodes: string[];
    androidDeepLink: string;
    androidAppindexingLink: string;
    iosAppindexingLink: string;
    vanityChannelUrl: string;
}
