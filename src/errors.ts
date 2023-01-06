import {AxiosError} from "axios";

export class CrawlError extends Error {
    get name(): string {
        return 'CrawlError';
    }
}

export class InvalidURLError extends CrawlError {
    get name(): string {
        return 'InvalidURLError';
    }
}

export class UnsupportedPageError extends CrawlError {
    get name(): string {
        return 'UnsupportedPageError';
    }
}

export class ParseError extends CrawlError {
    readonly #data: any;

    get name(): string {
        return 'ParseError';
    }

    get data() {
        return this.#data;
    }

    constructor(message: string, data: any) {
        super();
        this.#data = data;
    }
}

export class ChatFetchingError extends CrawlError {
    get name(): string {
        return 'ChatFetchingError';
    }
}

export class FetchError extends CrawlError {
    readonly #axiosError: AxiosError;

    get name(): string {
        return 'FetchError';
    }

    get status() {
        return this.#axiosError.response?.status;
    }

    get data() {
        return this.#axiosError.response?.data;
    }

    get originalError() {
        return this.#axiosError;
    }

    constructor(message: string, error: AxiosError) {
        super(message);
        this.#axiosError = error;
    }
}

export class BuildStateError extends CrawlError {
    get name(): string {
        return 'BuildStateError';
    }
}
