import * as JSON5 from 'json5';

const quotes: Readonly<Record<string, boolean>> = Object.freeze({"'": true, '"': true});

type StringRange = [number, number];

type ExtractResult<T> = {
    result: T;
    range: StringRange;
}

/**
 * Locate first javascript string from source starts at index
 * @param source
 * @param index
 */
export function locateString(source: string, index: number = 0): StringRange | null {
    while (!quotes[source[index]] && index < source.length) index++;
    if (index >= source.length) {
        return null;
    }
    let start = index;
    let quote = source[index];
    while ((++index) < source.length && source[index] !== quote) {
        if (source[index] === '\\') {
            index++; // skip next character when escape
        }
    }
    if (source[index] === quote) {
        return [start, index + 1];
    }
    return null;
}

/**
 * Locate first javascript object from source starts at index
 * @param source
 * @param index
 */
export function locateObject(source: string, index: number = 0): StringRange | null {
    let start = index = source.indexOf('{', index);
    if (start === -1) {
        return null;
    }
    let open = 1;
    while ((++index) < source.length && open > 0) {
        if (source[index] === '{') {
            open++;
        } else if (source[index] === '}') {
            open--;
        } else if (quotes[source[index]]) { // when string
            let loc = locateString(source, index);
            if (!loc) {
                return null;
            }
            index = loc[1] - 1;
        }
    }
    if (open === 0) {
        return [start, index];
    }
    return null;
}

export function extractObject<T extends object>(keyword: string, source: string, index: number = 0): ExtractResult<T> | null {
    index = source.indexOf(keyword, index);
    if (index < 0) {
        return null;
    }
    let loc = locateObject(source, index);
    if (!loc) {
        return null;
    }
    try {
        let json = source.slice(...loc);
        return {
            range: loc,
            result: JSON5.parse(json),
        }
    } catch (e) {
    }
    return null;
}

export function extractString(keyword: string, source: string, index: number = 0): ExtractResult<string> | null {
    index = source.indexOf(keyword, index);
    if (index < 0) {
        return null;
    }
    let loc = locateString(source, index);
    if (!loc) {
        return null;
    }
    try {
        let json = source.slice(...loc);
        return {
            range: loc,
            result: JSON5.parse(json),
        }
    } catch (e) {
    }
    return null;
}

export function sleep(timeout: number = 0){
    return new Promise(res => setTimeout(res, timeout));
}
