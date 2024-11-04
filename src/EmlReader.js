/*
 * Copyright © 2023 Netas Ltd., Switzerland.
 * @author  Lukas Buchs, lukas.buchs@netas.ch
 * @license MIT
 * @date    2023-02-17
 */

import {MultiPartParser} from './MultiPartParser.js';
export class EmlReader {
    #multipartParser = null;

    /**
     * @param {ArrayBuffer|Uint8Array} arrayBuffer
     * @returns {EmlReader}
     */
    constructor(arrayBuffer) {
        this.#multipartParser = new MultiPartParser(arrayBuffer);
    }

    getDate() {
        let date = this.#multipartParser.getHeader('date');
        if (date) {
            return new Date(date);
        }
        return null;
    }

    getSubject() {
        return this.#multipartParser.getHeader('subject', true, true);
    }

    getFrom() {
        return this.#multipartParser.getHeader('from', true, true);
    }

    getBcc() {
        return this.#multipartParser.getHeader('bcc', true, true);
    }

    getCc() {
        return this.#multipartParser.getHeader('cc', true, true);
    }

    getTo() {
        return this.#multipartParser.getHeader('to', true, true);
    }

    getReplyTo() {
        return this.#multipartParser.getHeader('reply-to', true, true);
    }

    getType() {
        if (this.#multipartParser.getHeader('received')) {
            return 'received';
        } else {
            return 'sent';
        }
    }

    getHeader(key, decode=false, removeLineBreaks=false) {
        return this.#multipartParser.getHeader(key, decode, removeLineBreaks);
    }

    getAttachments(sorted = false) {
        let attachments = [];
        const mixedPart = this.#multipartParser.getPartByContentType('multipart', 'mixed');
        if(mixedPart) for (const subPart of mixedPart.getMultiParts()) {
            if (!subPart.isAttachment) continue;
            attachments.push({
                filename: subPart.getFilename(),
                contentType: subPart.contentType,
                content: subPart.getBody(),
                filesize: subPart.getBody().byteLength
            });
        }
        let atts = this.#multipartParser.getPartByContentType('application', 'octet-stream');
        if (!atts) {
            atts = [];
        } else if (!(atts instanceof Array)) {
            atts = [atts];
        }
        const images = this.#multipartParser.getPartByContentType('image');
        if (images) {
            if (images instanceof Array) atts = atts.concat(images);
            else atts.push(images);
        }
        const result = attachments.concat(atts.filter(att => att && att.getFilename()).map(att => ({
            filename: att.getFilename(),
            contentType: att.contentType,
            content: att.getBody(),
            filesize: att.getBody().byteLength
        })));
        if (!sorted) return result;
        const cids = (this.getMessageHtml().match(/ src="cid:[^"]+"/g) || [])
            .map(s => s.substring(10,s.length-1));
        let n = cids.length;
        result.forEach((d, j) => {
            let k = -1;
            for (let i = 0; i < cids.length; i++) {
                k = cids.indexOf(d.filename);
                if (k > -1) break;
            }
            result[j].n = k > -1 ? k : n++;
        })
        result.sort((a,b,x='n')=>+(a[x]>b[x])-+(a[x]<b[x]));
        return result;
    }

    getMessageText() {
        let text = this.#multipartParser.getPartByContentType('text', 'plain');
        if (text && !text.isAttachment) {
            return text.getBody();
        }

        // HTML to text
        let html = this.#multipartParser.getPartByContentType('text', 'html');
        if (html && !html.isAttachment) {
            let htmlStr = html.getBody(), hIndex = htmlStr.indexOf('<body');
            if (hIndex !== -1) {
                htmlStr = htmlStr.substring(hIndex);
            }
            htmlStr = htmlStr.replace(/<style[\s\w\W]+<\/style>/g, '');

            let el = document.createElement('div');
            el.innerHTML = htmlStr;
            return el.innerText.replace(/\r?\n\s+\r?\n/g, "\n\n").trim();
        }

        return null;
    }

    getMessageHtml() {
        let html = this.#multipartParser.getPartByContentType('text', 'html');
        if (html && !html.isAttachment) {
            return html.getBody();
        }

        // text to html
        let text = this.#multipartParser.getPartByContentType('text', 'plain');
        if (text && !text.isAttachment) {
            return text.getBody().replace(/\r?\n/g, '<br />');
        }

        return null;
    }
}
