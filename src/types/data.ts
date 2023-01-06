/**
 * @see https://github.com/LinaTsukusu/youtube-chat/blob/develop/src/types/data.ts
 */

/** チャットメッセージの文字列or絵文字 */
export type MessageItem = {
    text: string;
    bold?: boolean;
    italics?: boolean;
    isLink?: true;
} | EmojiItem

/** 画像 */
export interface ImageItem {
    url: string
    alt: string
}

/** Emoji */
export interface EmojiItem extends ImageItem {
    emojiText: string
    isCustomEmoji: boolean
}

export interface ChatAuthor {
    name: string,
    id: string,
    thumbnail: ImageItem;
}

export interface Badge {
    thumbnail: ImageItem;
    label: string;
}

export interface BaseChatItem {
    id: string;
    author: ChatAuthor;
    memberBadge?: Badge;
    isVerified: boolean;
    isOwner: boolean;
    isModerator: boolean;
    timestamp: Date;
}

export interface DonationDetails {
    color: `#${string}`;
    amount: string;
}

export interface MessageBasedChatItem {
    message: MessageItem[];
}

export interface MessageChatItem extends MessageBasedChatItem {
    type: 'message';
}

export interface SuperChatItem extends MessageBasedChatItem {
    type: 'super-chat';
    donation: DonationDetails;
}

export interface SuperStickerItem extends MessageBasedChatItem {
    type: 'super-sticker';
    donation: DonationDetails;
    sticker: ImageItem;
}

export interface MembershipJoinItem extends BaseChatItem {
    type: 'join';
    tier: string;
}

export interface MembershipMilestoneItem extends MessageBasedChatItem {
    type: 'milestone';
    tier: string;
    milestone: string;
}

export interface MembershipGiftItem extends BaseChatItem {
    type: 'gift';
    amount: number;
}

export interface MembershipRedeemItem extends BaseChatItem {
    type: 'redeem';
    by: string;
}

export interface DeleteChatItem {
    type: 'delete';
    id: string;
}

export type ChatItem =
    MessageChatItem
    | SuperChatItem
    | SuperStickerItem
    | MembershipJoinItem
    | MembershipMilestoneItem
    | MembershipGiftItem
    | MembershipRedeemItem;
