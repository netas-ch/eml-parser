/*
 * Copyright © 2023 Netas Ltd., Switzerland.
 * @author  Lukas Buchs, lukas.buchs@netas.ch
 * @license MIT
 * @date    2023-02-17
 */

import {MultiPartParser} from './MultiPartParser.js';
import {htmlToPlainText, plainTextToHtml} from './html.js';

export class EmlReader {
    /** @type {MultiPartParser} */
    #multipartParser;

    /**
     * @param {ArrayBuffer|Uint8Array} arrayBuffer
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

    /**
     * @param {string} key
     * @param {boolean} decode
     * @param {boolean} removeLineBreaks
     */
    getHeader(key, decode=false, removeLineBreaks=false) {
        return this.#multipartParser.getHeader(key, decode, removeLineBreaks);
    }

    /**
     * @param {string} key
     * @param {boolean} decode
     * @param {boolean} removeLineBreaks
     */
    getHeaders(key, decode=false, removeLineBreaks=false) {
        return this.#multipartParser.getHeaders(key, decode, removeLineBreaks);
    }

    getAttachments() {
        let attachments=[], mixedPart = this.#multipartParser.getPartByContentType('multipart', 'mixed');

        // multipart/mixed
        if (mixedPart) {
            for (const subPart of mixedPart.getMultiParts()) {
                if (subPart.isAttachment) {
                    attachments.push({
                        filename: subPart.getFilename(),
                        contentType: subPart.contentType,
                        content: subPart.getBody(),
                        filesize: subPart.getFileSize(),
                    });
                }
            }

        // multipart/octet-stream
        } else {
            const att = this.#multipartParser.getPartByContentType('application', 'octet-stream');
            if (att && att.getFilename()) {
                attachments.push({
                    filename: att.getFilename(),
                    contentType: att.contentType,
                    content: att.getBody(),
                    filesize: att.getFileSize(),
                });
            }
        }

        return attachments;
    }

    /** @returns {string|null} */
    getMessageText() {
        let text = this.#multipartParser.getPartByContentType('text', 'plain');
        if (text && !text.isAttachment) {
            return text.getBody();
        }

        // HTML to text
        let html = this.#multipartParser.getPartByContentType('text', 'html');
        if (html && !html.isAttachment) {
            return htmlToPlainText(html.getBody());
        }

        return null;
    }

    /** @returns {string|null} */
    getMessageHtml() {
        let html = this.#multipartParser.getPartByContentType('text', 'html');
        if (html && !html.isAttachment) {
            return html.getBody();
        }

        // text to html
        let text = this.#multipartParser.getPartByContentType('text', 'plain');
        if (text && !text.isAttachment) {
            return plainTextToHtml(text.getBody());
        }

        return null;
    }
}
