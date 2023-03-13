/*
 * Copyright © 2023 Netas Ltd., Switzerland.
 * @author  Lukas Buchs, lukas.buchs@netas.ch
 * @license MIT
 * @date    2023-02-17
 */

import {MultiPartParser} from './MultiPartParser.js';
export class EmlReader {

    /**
     * @param {ArrayBuffer|Uint8Array} rawContent
     * @returns {EmlReader}
     */
    constructor(arrayBuffer) {
        this._multipartParser = new MultiPartParser(arrayBuffer);
    }

    getDate() {
        let date = this._multipartParser.getHeader('date');
        if (date) {
            return new Date(date);
        }
        return null;
    }

    getSubject() {
        return this._multipartParser.getHeader('subject', true, true);
    }

    getFrom() {
        return this._multipartParser.getHeader('from', true, true);
    }

    getCc() {
        return this._multipartParser.getHeader('cc', true, true);
    }

    getTo() {
        return this._multipartParser.getHeader('to', true, true);
    }

    getReplyTo() {
        return this._multipartParser.getHeader('reply-to', true, true);
    }

    getAttachments() {
        let attachments=[], mixedPart = this._multipartParser.getPartByContentType('multipart', 'mixed');

        if (mixedPart) {
            for (const subPart of mixedPart.getMultiParts()) {
                if (subPart.isAttachment) {
                    attachments.push({
                        filename: subPart.getFilename(),
                        contentType: subPart.contentType,
                        content: subPart.getBody(),
                        filesize: subPart.getBody().byteLength
                    });
                }
            }
        }

        return attachments;
    }

    getMessageText() {
        let text = this._multipartParser.getPartByContentType('text', 'plain');
        if (text && !text.isAttachment) {
            return text.getBody();
        }

        // HTML to text
        let html = this._multipartParser.getPartByContentType('text', 'html');
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
        let html = this._multipartParser.getPartByContentType('text', 'html');
        if (html && !html.isAttachment) {
            return html.getBody();
        }

        // text to html
        let text = this._multipartParser.getPartByContentType('text', 'plain');
        if (text && !text.isAttachment) {
            return text.getBody().replace(/\r?\n/g, '<br />');
        }

        return null;
    }


}