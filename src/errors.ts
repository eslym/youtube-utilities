import {AxiosError} from "axios";

export class CrawlError extends Error {
}

export class InvalidURLError extends CrawlError {
}

export class UnsupportedPageError extends CrawlError {
}

export class ParseError extends CrawlError {
    readonly #data: any;

    get data() {
        return this.#data;
    }

    constructor(message: string, data: any) {
        super();
        this.#data = data;
    }
}

export class ChatFetchingError extends CrawlError {
}

export class FetchError extends CrawlError {
    readonly #axiosError: AxiosError;

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
