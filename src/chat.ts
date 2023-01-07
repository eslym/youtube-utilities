import {Action, GetLiveChatResponse, MessageRendererBase, MessageRun, Thumbnail} from "./types/youtube";
import {client} from "./client";
import {
    BaseChatItem,
    ChatAuthor,
    ChatItem,
    DeleteChatItem,
    ImageItem,
    MembershipGiftItem,
    MembershipJoinItem,
    MembershipMilestoneItem,
    MembershipRedeemItem,
    MessageChatItem,
    MessageItem,
    SuperChatItem,
    SuperStickerItem
} from "./types/data";
import {EventEmitter} from 'events';
import TypedEmitter from "typed-emitter/rxjs";
import {z} from "zod";
import {AxiosError} from "axios";
import {ChatFetchingError, FetchError, ParseError} from "./errors";

async function fetchChat(apiKey: string, continuation: string, clientVersion: string): Promise<GetLiveChatResponse> {
    let url = `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat`
    let res = await client.post(url, {
        context: {
            client: {
                clientVersion: clientVersion,
                clientName: "WEB",
            },
        },
        continuation: continuation,
    }, {params: {key: apiKey}});

    return res.data;
}

type TYPE_MAP = {
    'message': MessageChatItem;
    'super-chat': SuperChatItem;
    'super-sticker': SuperStickerItem;
    'join': MembershipJoinItem;
    'milestone': MembershipMilestoneItem;
    'gift': MembershipGiftItem;
    'redeem': MembershipRedeemItem;
};

function convertImage(data: Thumbnail[], alt: string): ImageItem {
    const thumbnail = data.pop()
    if (thumbnail) {
        return {
            url: thumbnail.url,
            alt: alt,
        }
    } else {
        return {
            url: "",
            alt: "",
        }
    }
}

function convertMessage(runs: MessageRun[]): MessageItem[] {
    return runs.map((run: MessageRun): MessageItem => {
        if ("text" in run) {
            let text: any = {
                text: run.text
            };
            if ('navigationEndpoint' in run) {
                text.isLink = true;
            }
            if (run.bold) {
                text.bold = true;
            }
            if (run.italics) {
                text.italics = true;
            }
            return text;
        } else {
            // Emoji
            const thumbnail = run.emoji.image.thumbnails.shift()
            const isCustomEmoji = Boolean(run.emoji.isCustomEmoji)
            const shortcut = run.emoji.shortcuts ? run.emoji.shortcuts[0] : ""
            return {
                url: thumbnail ? thumbnail.url : "",
                alt: shortcut,
                isCustomEmoji: isCustomEmoji,
                emojiText: isCustomEmoji ? shortcut : run.emoji.emojiId,
            }
        }
    })
}

function convertColor(colorNum: number): `#${string}` {
    return `#${colorNum.toString(16).padStart(6, '0').slice(2).toLocaleUpperCase()}`;
}

function buildBase<T extends keyof TYPE_MAP>(type: T, renderer: MessageRendererBase): TYPE_MAP[T] {
    let name = renderer.authorName?.simpleText ?? "";
    let author: ChatAuthor = {
        name,
        thumbnail: convertImage(renderer.authorPhoto.thumbnails, name),
        id: renderer.authorExternalChannelId,
    }
    let item: BaseChatItem & { type: T } = {
        type,
        id: renderer.id,
        author,
        isOwner: false,
        isVerified: false,
        isModerator: false,
        timestamp: new Date(Number(renderer.timestampUsec) / 1000)
    };
    if (renderer.authorBadges) {
        for (let entry of renderer.authorBadges) {
            let badge = entry.liveChatAuthorBadgeRenderer
            if (badge.customThumbnail) {
                item.memberBadge = {
                    thumbnail: convertImage(badge.customThumbnail.thumbnails, badge.tooltip),
                    label: badge.tooltip,
                };
            } else {
                switch (badge.icon?.iconType) {
                    case "OWNER":
                        item.isOwner = true
                        break
                    case "VERIFIED":
                        item.isVerified = true
                        break
                    case "MODERATOR":
                        item.isModerator = true
                        break
                }
            }
        }
    }
    return item as any;
}

function convertAction(action: Action): ChatItem | DeleteChatItem | null {
    if (action.markChatItemAsDeletedAction || action.removeChatItemAction) {
        let record = (action.markChatItemAsDeletedAction ?? action.removeChatItemAction) as {targetItemId: string};
        return {
            type: 'delete',
            id: record.targetItemId
        }
    }

    if (!action.addChatItemAction) {
        return null;
    }

    let item = action.addChatItemAction.item;

    if (item.liveChatSponsorshipsGiftPurchaseAnnouncementRenderer) {
        let renderer = {
            ...item.liveChatSponsorshipsGiftPurchaseAnnouncementRenderer.header.liveChatSponsorshipsHeaderRenderer,
            ...item.liveChatSponsorshipsGiftPurchaseAnnouncementRenderer
        };
        let ret = buildBase('gift', renderer);
        ret.amount = Number((renderer.primaryText.runs[1] as { text: string }).text);
        return ret;
    }

    if (item.liveChatTextMessageRenderer) {
        let renderer = item.liveChatTextMessageRenderer;
        let ret = buildBase('message', renderer);
        ret.message = convertMessage(renderer.message.runs);
        return ret;
    }

    if (item.liveChatPaidMessageRenderer) {
        let renderer = item.liveChatPaidMessageRenderer;
        let ret = buildBase('super-chat', renderer);
        ret.message = convertMessage(renderer.message?.runs ?? []);
        ret.donation = {
            amount: renderer.purchaseAmountText.simpleText,
            color: convertColor(renderer.bodyBackgroundColor),
        }
        return ret;
    }

    if (item.liveChatPaidStickerRenderer) {
        let renderer = item.liveChatPaidStickerRenderer;
        let ret = buildBase('super-sticker', renderer);

        ret.donation = {
            amount: renderer.purchaseAmountText.simpleText,
            color: convertColor(renderer.backgroundColor),
        };

        ret.sticker = convertImage(
            renderer.sticker.thumbnails,
            renderer.sticker.accessibility.accessibilityData.label
        );

        return ret;
    }

    if (item.liveChatMembershipItemRenderer) {
        let renderer = item.liveChatMembershipItemRenderer;
        if (renderer.headerPrimaryText) {
            let ret = buildBase('milestone', renderer);
            ret.message = convertMessage(renderer.message?.runs ?? []);
            ret.milestone = renderer.headerPrimaryText.runs.map(r => (r as any).text).join('');
            ret.tier = (renderer.headerSubtext as { simpleText: string }).simpleText;
            return ret;
        } else {
            let ret = buildBase('join', renderer);
            ret.tier = (renderer.headerSubtext as { runs: any[] }).runs[1].text;
            return ret;
        }
    }

    if (item.liveChatSponsorshipsGiftRedemptionAnnouncementRenderer) {
        const renderer = item.liveChatSponsorshipsGiftRedemptionAnnouncementRenderer;
        const ret = buildBase('redeem', renderer);
        ret.by = (renderer.message.runs[1] as any).text;
        return ret;
    }

    return null;
}

type ChatFetcherEvents = {
    start: () => void;
    chat: (item: ChatItem) => void;
    delete: (id: string) => void;
    stop: (reason?: string) => void;
    error: (error: Error) => void;

    state: (state: ChatFetcherState) => void;

    unknown: (action: object) => void;

    raw: (action: object) => void;
}

const StateSchema = z.object({
    apiKey: z.string(),
    clientVersion: z.string(),
    continuation: z.string()
})

export type ChatFetcherState = z.infer<typeof StateSchema>;

export type ChatFetcherOptions = {
    interval?: number;
    debug?: boolean;
};

/**
 * Class to fetch youtube chat from public livestream.
 */
export class ChatFetcher extends (EventEmitter as any as new () => TypedEmitter<ChatFetcherEvents>) {
    readonly #apiKey: string;
    readonly #clientVersion: string;
    #continuation: string;

    #timeout?: NodeJS.Timeout = undefined;

    #attempts: number = 0;

    interval: number;

    debug: boolean;

    /**
     * The current state of fetcher
     */
    get state(): Readonly<ChatFetcherState> {
        return Object.freeze({
            apiKey: this.#apiKey,
            clientVersion: this.#clientVersion,
            continuation: this.#continuation
        });
    }

    constructor(state: ChatFetcherState);
    constructor(state: ChatFetcherState, interval: number);
    constructor(state: ChatFetcherState, options: ChatFetcherOptions);
    constructor(state: ChatFetcherState, options: number | ChatFetcherOptions | undefined = undefined) {
        super();
        StateSchema.parse(state);
        this.#apiKey = state.apiKey;
        this.#clientVersion = state.clientVersion;
        this.#continuation = state.continuation;
        if (typeof options === 'number') {
            options = {
                interval: options,
                debug: false,
            };
        }
        this.interval = options?.interval ?? 1000;
        this.debug = options?.debug ?? false;
    }

    /**
     * Start the fetching process
     */
    start(): boolean {
        if (this.#timeout) return false;
        this.#timeout = setTimeout(this.#cycle.bind(this), 0);
        return true;
    }

    /**
     * Stop the fetching process
     * @param reason
     */
    stop(reason?: string): boolean {
        if (!this.#timeout) return false;
        clearTimeout(this.#timeout);
        this.emit('stop', reason);
        return true;
    }

    async #cycle() {
        try {
            let res = await fetchChat(this.#apiKey, this.#continuation, this.#clientVersion);

            if (!res.continuationContents?.liveChatContinuation) {
                this.stop('ended');
                return;
            }

            if (res.continuationContents.liveChatContinuation.actions) {
                for (let action of res.continuationContents.liveChatContinuation.actions) {
                    if (this.debug) {
                        this.emit('raw', JSON.parse(JSON.stringify(action)));
                    }
                    try {
                        let item = convertAction(action);
                        if (!item) {
                            if (this.debug) {
                                this.emit('unknown', action);
                            }
                            continue;
                        }
                        if (item.type === 'delete') {
                            this.emit('delete', item.id);
                            continue;
                        }
                        this.emit('chat', item);
                    } catch (e) {
                        // Only kind of error will not stop the process.
                        this.emit('error', new ParseError('Unable to parse action.', action));
                    }
                }
            }

            let continuationData = res.continuationContents.liveChatContinuation.continuations[0];
            if (continuationData.invalidationContinuationData) {
                this.#continuation = continuationData.invalidationContinuationData.continuation;
                this.emit('state', this.state);
            } else if (continuationData.timedContinuationData) {
                this.#continuation = continuationData.timedContinuationData.continuation;
                this.emit('state', this.state);
            } else {
                this.emit('error', new ChatFetchingError('Continuation not found.'));
                this.stop('error');
                return;
            }

            this.#timeout = setTimeout(this.#cycle.bind(this), this.interval);
        } catch (err) {
            if (!(err instanceof Error)) {
                this.emit('error', new Error('Unknown Error'));
                this.stop('error');
                return;
            }

            if ((('code' in err && err.code === 'ECONNABORTED') || (err instanceof AxiosError && err.response?.status === 503)) && this.#attempts < 5) {
                this.#attempts++;
                this.#timeout = setTimeout(this.#cycle.bind(this), this.interval * this.#attempts);
                return;
            }

            if (err instanceof AxiosError) {
                this.emit('error', new FetchError("Error while fetching chats.", err));
                this.stop('error');
                return;
            }

            this.emit('error', err);
            this.stop('error');
        }
    }
}
