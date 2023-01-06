# YouTube Utilities
This is a library to help crawl data from YouTube, currently support channel metadata and video details.

This project is inspired by [LinaTsukusu/youtube-chat](https://github.com/LinaTsukusu/youtube-chat),
a lot of code are from that project also, so please take a look on that.

## Disclaimer
This library is not using standard API to extract data, so it does not guarantee to work in the future.
It uses a crawling method to extract data from YouTube, so use it at your own risk.

## Features
1. Identify page type (video/channel)
2. Extract metadata and video details from page
3. Fetch chat from public livestream

## Installation
```shell
npm install @eslym/youtube-utilities
```
```shell
yarn add @eslym/youtube-utilities
```

## Usage
### Extract data from a youtube url

```typescript
import {crawl} from "@eslym/youtube-utilities";

let result = await crawl('https://youtube.com/...');

if (result.type === 'profile') {
    console.log('This is a channel page, named ' + result.metadata.title);
} else if (result.type === 'video') {
    console.log('This is a video page, named ' + result.metadata.title);
}
```

### Fetch YouTube chat from livestream
```typescript
import {crawl, ChatFetcher} from "@eslym/youtube-utilities";

let result = await crawl('https://youtube.com/watch?v=VIDEO_ID');

let state = {
    apiKey: result.apiKey,
    clientVersion: result.clientVersion,
    continuation: result.liveAbility.continuations.reverse()[0],
};

let fetcher = new ChatFetcher(state);

fetcher.on('chat', chat => {
    console.log(chat);
});

fetcher.start();
```
