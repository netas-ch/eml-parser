/*
 * Copyright © 2023 Netas Ltd., Switzerland.
 * @author  Lukas Buchs, lukas.buchs@netas.ch
 * @license MIT
 * @date    2023-02-17
 */

export class MultiPartParser {
    /** @type {Partial<Record<string, string[]>>} */
    #headers;
    /** @type {Uint8Array|ArrayBuffer|null|string} */
    #body = null;
    /** @type {MultiPartParser[]} */
    #multiParts;
    #isAttachment = false;
    #lineEnding;

    /**
     * @param {ArrayBuffer|Uint8Array} rawContent
     */
    constructor(rawContent) {
        this.#headers = {};
        this.#multiParts = [];

        if (typeof rawContent !== 'object') {
            throw new Error('invalid content for class MultiPartParser');
        }

        this.#lineEnding = this.#getLineEnding(rawContent);
        const parts = this.#splitHeaderFromBody(rawContent);

        // parsing header
        if (parts.header) {
            const decoder = new TextDecoder('utf-8');
            const headerRaw = decoder.decode(parts.header);
            const headers = headerRaw.split(/\n(?=[^\s])/g);

            for (let header of headers) {
                const sepPos = header.indexOf(':');
                if (sepPos !== -1) {
                    const key = header.substring(0, sepPos).toLowerCase().trim(), value=header.substring(sepPos+1).trim();

                    this.#headers[key] ??= [];
                    this.#headers[key].push(value);
                }
            }
        }

        // Body
        let contentType = this.getContentType();

        // Attachment
        const [contentDisposition] = this.getHeaders('Content-Disposition');
        if (contentDisposition && contentDisposition.match(/attachment/i)) {
            this.#isAttachment = true;
        }

        if (this.#isAttachment) {
            this.#parseBodyApplication(parts.body);

        } else {
            switch (contentType.mediaType) {
                case 'multipart': this.#parseBodyMultipart(parts.body, contentType.args); break;
                case 'text': this.#parseBodyText(parts.body); break;
                default: this.#parseBodyApplication(parts.body); break;
            }
        }
    }

    // *******************
    // GETTER
    // *******************

    get isAttachment() { return this.#isAttachment; };

    get contentType() {
        let ct = this.getContentType();
        if (ct.mediaType && ct.subType) {
            return ct.mediaType + '/' + ct.subType;
        }
        return null;
     }

    // *******************
    // PUBLIC
    // *******************

    /**
     * returns the content type as a object.
     */
    getContentType() {
        let [ct] = this.getHeaders('Content-Type');
        if (ct) {
            let prts = ct.match(/([a-z]+)\/([a-z0-9\-\.\+_]+);?((?:.|\s)*)$/i);
            if (prts) {
                const args = prts[3] && prts[3].trim() !== '' ? prts[3].trim() : null;
                return { mediaType: prts[1].toLowerCase(), subType: prts[2].toLowerCase(), args: args };
            }
        }
        return { mediaType: null, subType: null, args: null };
    }

    getFileSize() {
        if (this.#body == null) return 0;
        if (this.#body instanceof Uint8Array || this.#body instanceof ArrayBuffer) return this.#body.byteLength;
        return new TextEncoder().encode(this.#body).length;
    }

    getBody() {
        return this.#body;
    }

    /**
     * sarch a MultiPart with a specific media type
     * @param {string} mediaType
     * @param {string|null} subType
     * @returns {MultiPartParser|null}
     */
    getPartByContentType(mediaType, subType=null) {
        let el = this.#recursiveGetByContentType(this, mediaType, subType);
        if (el) {
            return el;
        }

        return null;
    }

    /**
     * @param {string} key
     * @param {boolean} decode
     * @param {boolean} removeLineBreaks
     * @returns {string|null}
     */
    getHeader(key, decode = false, removeLineBreaks = false) {
        const [result] = this.getHeaders(key, decode, removeLineBreaks);
        return result ?? null;
    }

    /**
     * Returns all headers for a given key.
     * @param {string} key
     * @param {boolean} decode
     * @param {boolean} removeLineBreaks
     */
    getHeaders(key, decode=false, removeLineBreaks=false) {
        let val = this.#headers[key.toLowerCase()] ?? [];

        if (decode) {
            val = val.map(this.#decodeRfc1342.bind(this));
        }

        if (removeLineBreaks) {
            val = val.map((v) => { return v.replace(/\r?\n\s/g, ''); });
        }

        return val;
    }

    getMultiParts() {
        return this.#multiParts;
    }

    /**
     * returns the filename of the content, if found
     * @returns {string}
     */
    getFilename() {
        let [cd] = this.getHeaders('Content-Disposition'), cdM = cd && cd.match(/filename=\"?([^"\n]+)\"?/i);
        if (cdM) {
            return this.#decodeRfc1342(cdM[1]);
        }

        let [ct] = this.getHeaders('Content-Type'), ctM = ct && ct.match(/name=\"?([^"\n]+)\"?/i);
        if (ctM) {
            return this.#decodeRfc1342(ctM[1]);
        }

        return null;
    }

    // *******************
    // PRIVATE
    // *******************

    /**
     * @param {string|Uint8Array} rawArray
     * @param {string|null} charset
     */
    #decodeContent(rawArray, charset=null) {
        let [contentTransferEncoding] = this.getHeaders('Content-Transfer-Encoding');
        if (contentTransferEncoding) {
            contentTransferEncoding = contentTransferEncoding.toUpperCase();
        } else {
            contentTransferEncoding = 'BINARY';
        }

        switch (contentTransferEncoding) {
            case 'BASE64': return this.#decodeBase64(rawArray);
            case 'QUOTED-PRINTABLE': return this.#decodeQuotedPrintable(rawArray, charset);
            case '8BIT':
            case '7BIT':
            case 'BINARY': return rawArray;
        }
    }

    /**
     * @param {string} string
     */
    #decodeRfc1342(string) {
        // =?utf-8?Q?Kostensch=C3=A4tzung=5F451.pdf?=
        const decoder = new TextDecoder();
        string = string.replace(/=\?([0-9a-z\-_:]+)\?(B|Q)\?(.*?)\?=/ig, (m, charset, encoding, encodedText) => {
            let buf = null;
            switch (encoding.toUpperCase()) {
                case 'B': buf = this.#decodeBase64(encodedText, charset); break;
                case 'Q': buf = this.#decodeQuotedPrintable(encodedText, charset, true); break;
                default: throw new Error('invalid string encoding "' + encoding + '"');
            }
            return decoder.decode(new Uint8Array(buf));
        });

        return string;
    }

    /**
     * @param {Uint8Array|string} raw
     * @param {string|null} charset
     * @returns {ArrayBuffer}
     */
    #decodeBase64(raw, charset=null) {
        if (raw instanceof Uint8Array) {
            const decoder = new TextDecoder();
            raw = decoder.decode(raw);
        }
        const binary_string = atob(raw);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        if (!charset) {
            return bytes.buffer;

        } else {
            // convert to utf-8
            const dec = new TextDecoder(charset), enc = new TextEncoder();
            const arr = enc.encode(dec.decode(bytes));
            return arr.buffer;
        }
    }

    /**
     * @param {Uint8Array|string} raw
     * @param {string|null} charset
     * @param {boolean} replaceUnderline
     * @returns {ArrayBuffer}
     */
    #decodeQuotedPrintable(raw, charset, replaceUnderline=false) {
        if (raw instanceof Uint8Array) {
            const decoder = new TextDecoder();
            raw = decoder.decode(raw);
        }

        // in RFC 1342 underline is used for space
        if (replaceUnderline) {
            raw = raw.replace(/_/g, ' ');
        }

        const dc = new TextDecoder(charset ?? 'utf-8');
        const str = raw.replace(/[\t\x20]$/gm, "").replace(/=(?:\r\n?|\n)/g, "").replace(/((?:=[a-fA-F0-9]{2})+)/g, (m) => {
            const cd = m.substring(1).split('='), uArr=new Uint8Array(cd.length);
            for (let i = 0; i < cd.length; i++) {
                uArr[i] = parseInt(cd[i], 16);
            }
            return dc.decode(uArr);
        });

        const encoder = new TextEncoder();
        const arr = encoder.encode(str);
        return arr.buffer;
    }

    #getBoundary(contentTypeArgs) {
        const mtch = contentTypeArgs.match(/boundary=\"?([^"\s\n]+)\"?/i);
        if (mtch) {
            return mtch[1];
        }
        return null;
    }

    #recursiveGetByContentType(me, mediaType, subType) {
        const meCt = me.getContentType();
        if (mediaType === meCt.mediaType && (!subType || subType === meCt.subType)) {
            return me;
        }

        for (let mp of me.getMultiParts()) {
            if (mp instanceof MultiPartParser) {
                let subMp = this.#recursiveGetByContentType(mp, mediaType, subType);
                if (subMp) {
                    return subMp;
                }
            }
        }

        return null;
    }

    #getLineEnding(arrbuf) {
        const arr = new Uint8Array(arrbuf), r = 0x0D, n = 0x0A; // \r\n suchen
        let unix = 0, win = 0;

        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === n && arr[i-1] === r) {
                win++;
            } else if (arr[i] === n) {
                unix++;
            }
        }

        if (unix > 0 && win > 0) {
            return 'mixed';
        } else if (unix > 0) {
            return 'unix';
        } else if (win > 0) {
            return 'windows';
        }

        return 'unknown';
    }

    #splitHeaderFromBody(arrbuf) {
        const arr = new Uint8Array(arrbuf), r = 0x0D, n = 0x0A; // \r\n suchen
        let separatorPos = null, separatorLength=0;
        for (let i = 0; i < arr.length; i++) {
            if (this.#lineEnding !== 'unix' && arr[i] === r && arr[i+1] === n && arr[i+2] === r && arr[i+3] === n) {
                separatorLength = 4;
                separatorPos = i;
                break;
            } else if (arr[i] === n && arr[i+1] === n) {
                separatorLength = 2;
                separatorPos = i;
                break;
            }
        }

        let headerArray = null;
        let bodyArray = null;

        if (separatorPos) {
            headerArray = arr.slice(0, separatorPos);
            bodyArray = arr.slice(separatorPos+separatorLength);
        } else {
            // https://docs.fileformat.com/email/eml/#headers-information
            // "An EML file consists of Headers information and optionally message body."
            // (i.e. header is required but body is optional)
            headerArray = arr;
        }

        return { header: headerArray, body: bodyArray };
    }

    /** @param {Uint8Array} rawArray */
    #parseBodyApplication(rawArray) {
        this.#body = this.#decodeContent(rawArray, null);
    }

    #parseBodyText(rawArray) {

        // charset?
        let charset = 'utf-8';
        const contentTypeArgs = this.getContentType().args;
        if (contentTypeArgs && contentTypeArgs.match(/charset=\"?([^"\s\n;]+)\"?/i)) {
            const cm = contentTypeArgs.match(/charset=\"?([^"\s\n;]+)\"?/i);
            charset = cm[1];
        }

        const arrayBuf = this.#decodeContent(rawArray, charset);

        // Text always as utf-8
        const decoder = new TextDecoder();
        const bytes = new Uint8Array(arrayBuf);
        this.#body = decoder.decode(bytes);
    }

    #parseBodyMultipart(rawArray, contentTypeArgs) {
        const boundary = this.#getBoundary(contentTypeArgs);
        if (!boundary) {
            throw new Error('Boundary not found.');
        }

        const lastBoundaryPattern = "--" + boundary + "--";
        const lastBoundary = this.#indexOfString(rawArray, lastBoundaryPattern);
        if (lastBoundary === -1) {
            throw new Error('Final Boundary not found');
        }

        let raw = rawArray.slice(0, lastBoundary+lastBoundaryPattern.length);

        for (let i = 0; i < 1000; i++) {
            let boundaryPattern = "--" + boundary;
            let sectionStartBoundary = this.#indexOfString(raw, boundaryPattern);

            let sectionEndBoundary = this.#indexOfString(raw, boundaryPattern, sectionStartBoundary+1);

            // next section not found, break
            if (sectionStartBoundary === -1 || sectionEndBoundary === -1) {
                break;
            }
            sectionStartBoundary += boundaryPattern.length;

            const section = raw.slice(sectionStartBoundary, sectionEndBoundary);
            this.#multiParts.push(new MultiPartParser(section));

            raw = raw.slice(sectionEndBoundary);
        }
    }

    #indexOfString(byteArray, string, offset=0, encoding='utf-8') {
        const encoder = new TextEncoder(encoding);
        const patternArray = encoder.encode(string);

        // search first occurence of searchArray in byteArray
        return byteArray.findIndex((c, index) => {
            if (index < offset) {
                return false;
            }
            for (let i = 0; i < patternArray.length; i++) {
                if (byteArray[index + i] !== patternArray[i]) {
                    return false;
                }
            }
            return true;
        });
    }
}
