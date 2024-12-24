// @ts-check

import * as fs from "node:fs/promises";
import { describe, it } from "node:test";
import { Buffer } from "node:buffer";
import assert from "node:assert/strict";
import { basename } from "node:path";
import { EmlReader } from "../src/EmlReader.js";

const fixtures = {
    sample: "./src/_fixtures/sample.eml",
    sample_sans_html: "./src/_fixtures/sample_sans_html.eml",
    sample_sans_plain: "./src/_fixtures/sample_sans_plain.eml",
    cc: "./src/_fixtures/cc.eml",
    multipart: "./src/_fixtures/multipart.eml",
};

describe(EmlReader.name, () => {
    describe(basename(fixtures.sample), async () => {
        const eml = new EmlReader(await fs.readFile("./src/_fixtures/sample.eml"));

        it(eml.getSubject.name, () => {
            /** @type {string|null} */
            const actual = eml.getSubject();
            assert.deepEqual(actual, 'Winter promotions');
        });

        it(eml.getDate.name, () => {
            /** @type {Date|null} */
            const actual = eml.getDate();
            assert.deepEqual(actual, new Date('2014-01-29T10:10:06.000Z'));
        });

        it(eml.getFrom.name, () => {
            /** @type {string|null} */
            const actual = eml.getFrom();
            assert.deepEqual(actual, 'Online Shop <no-reply@example.com>');
        });

        it(eml.getTo.name, () => {
            /** @type {string|null} */
            const actual = eml.getTo();
            assert.deepEqual(actual, '"Foo Bar" <foo.bar@example.com>');
        });

        it(eml.getCc.name, () => {
            /** @type {string|null} */
            const actual = eml.getCc();
            assert.deepEqual(actual, null);
        });

        it(eml.getBcc.name, () => {
            /** @type {string|null} */
            const actual = eml.getBcc();
            assert.deepEqual(actual, null);
        });

        it(eml.getReplyTo.name, () => {
            /** @type {string|null} */
            const actual = eml.getReplyTo();
            assert.deepEqual(actual, null);
        });

        it(eml.getMessageText.name, () => {
            /** @type {string|null} */
            const actual = eml.getMessageText();
            assert.deepEqual(actual, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris enim orci, semper vel egestas nec, tempor sit amet nunc. Quisque pulvinar eleifend massa, sit amet posuere lorem vehicula et. Nam elementum nulla eget nisl ultrices vulputate. Sed molestie ipsum at neque molestie tempor vel et augue. Nam magna velit, cursus sed lectus eu, bibendum viverra orci. Morbi quis risus sed nunc pharetra mattis. Suspendisse ut consectetur risus. Donec in suscipit purus, eget aliquet dui. In vitae suscipit est. Suspendisse sollicitudin, nisl sed scelerisque pulvinar, nibh mi viverra diam, et convallis nibh urna id sem. Nunc eros ante, semper sed ex vitae, iaculis tristique sapien. Maecenas molestie leo a iaculis viverra. Vivamus tristique enim vel ligula semper tristique et congue ex. Praesent auctor egestas augue ut molestie. Integer vulputate tortor quis tempor faucibus.\r\n\nCurabitur sed accumsan od\nio. Integer vestibulum in sem nec vestibulum. Donec imperdiet turpis a faucibus volutpat. Suspendisse varius rhoncus eros, non rutrum justo pellentesque sit amet. In risus lectus, blandit sit amet magna a, porttitor pulvinar justo. Curabitur tincidunt metus at luctus fermentum. Cras vehicula dui eget semper vulputate. Ut sed leo non arcu imperdiet ultrices et eu dolor. Vestibulum aliquet sed elit a gravida. Aenean vitae est nec tellus molestie fringilla in eget enim. Morbi sodales auctor erat, eget posuere nisl condimentum aliquet. Phasellus commodo metus aliquet vestibulum ultricies. Quisque eleifend in mi vitae imperdiet. Quisque sit amet luctus nisl, vel sagittis mi. Etiam tellus tortor, blandit ut eros quis, iaculis eros.\r\n\n\n");
        });

        it(eml.getMessageHtml.name, () => {
            /** @type {string|null} */
            const actual = eml.getMessageHtml();
            assert.deepEqual(actual, '<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>Lorem ipsum</title>\n\t<meta name="description" content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris enim orci, semper vel egestas nec, tempor sit amet nunc. Quisque pulvinar eleifend massa, sit amet posuere lorem vehicula et." />\n\t<meta name="viewport" content="width=device-width; initial-scale=1.0">\n\t<meta http-equiv="content-type" content="text/html; charset=utf-8" />\n</head>\n<body>\n\t<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris enim orci, semper vel egestas nec, tempor sit amet nunc. Quisque pulvinar eleifend massa, sit amet posuere lorem vehicula et. Nam elementum nulla eget nisl ultrices vulputate. Sed molestie ipsum at neque molestie tempor vel et augue. Nam magna velit, cursus sed lectus eu, bibendum viverra orci. Morbi quis risus sed nunc pharetra mattis. Suspendisse ut consectetur risus. Donec in suscipit purus, eget aliquet dui. In vitae suscipit est. Suspendisse sollicitudin, nisl sed scelerisque pulvinar, nibh mi viverra diam, et convallis nibh urna id sem. Nunc eros ante, semper sed ex vitae, iaculis tristique sapien. Maecenas molestie leo a iaculis viverra. Vivamus tristique enim vel ligula semper tristique et congue ex. Praesent auctor egestas augue ut molestie. Integer vulputate tortor quis tempor faucibus.</p>\n\t<p>Curabitur sed accumsan odio. Integer vestibulum in sem nec vestibulum. Donec imperdiet turpis a faucibus volutpat. Suspendisse varius rhoncus eros, non rutrum justo pellentesque sit amet. In risus lectus, blandit sit amet magna a, porttitor pulvinar justo. Curabitur tincidunt metus at luctus fermentum. Cras vehicula dui eget semper vulputate. Ut sed leo non arcu imperdiet ultrices et eu dolor. Vestibulum aliquet sed elit a gravida. Aenean vitae est nec tellus molestie fringilla in eget enim. Morbi sodales auctor erat, eget posuere nisl condimentum aliquet. Phasellus commodo metus aliquet vestibulum ultricies. Quisque eleifend in mi vitae imperdiet. Quisque sit amet luctus nisl, vel sagittis mi. Etiam tellus tortor, blandit ut eros quis, hendrerit iaculis eros.</p>\n</body>\n</html>\n\n\n');
        });
    });

    describe(basename(fixtures.sample_sans_html), async () => {
        const eml = new EmlReader(await fs.readFile(fixtures.sample_sans_html));

        it(eml.getMessageText.name, () => {
            assert.deepEqual(
                eml.getMessageHtml(),
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris enim orci, semper vel egestas nec, tempor sit amet nunc. Quisque pulvinar eleifend massa, sit amet posuere lorem vehicula et. Nam elementum nulla eget nisl ultrices vulputate. Sed molestie ipsum at neque molestie tempor vel et augue. Nam magna velit, cursus sed lectus eu, bibendum viverra orci. Morbi quis risus sed nunc pharetra mattis. Suspendisse ut consectetur risus. Donec in suscipit purus, eget aliquet dui. In vitae suscipit est. Suspendisse sollicitudin, nisl sed scelerisque pulvinar, nibh mi viverra diam, et convallis nibh urna id sem. Nunc eros ante, semper sed ex vitae, iaculis tristique sapien. Maecenas molestie leo a iaculis viverra. Vivamus tristique enim vel ligula semper tristique et congue ex. Praesent auctor egestas augue ut molestie. Integer vulputate tortor quis tempor faucibus.<br /><br />Curabitur sed accumsan od<br />io. Integer vestibulum in sem nec vestibulum. Donec imperdiet turpis a faucibus volutpat. Suspendisse varius rhoncus eros, non rutrum justo pellentesque sit amet. In risus lectus, blandit sit amet magna a, porttitor pulvinar justo. Curabitur tincidunt metus at luctus fermentum. Cras vehicula dui eget semper vulputate. Ut sed leo non arcu imperdiet ultrices et eu dolor. Vestibulum aliquet sed elit a gravida. Aenean vitae est nec tellus molestie fringilla in eget enim. Morbi sodales auctor erat, eget posuere nisl condimentum aliquet. Phasellus commodo metus aliquet vestibulum ultricies. Quisque eleifend in mi vitae imperdiet. Quisque sit amet luctus nisl, vel sagittis mi. Etiam tellus tortor, blandit ut eros quis, iaculis eros.<br /><br /><br />',
            );
        });
    });

    describe(basename(fixtures.sample_sans_plain), async () => {
        const eml = new EmlReader(await fs.readFile(fixtures.sample_sans_plain));

        it(eml.getMessageText.name, () => {
            assert.deepEqual(
                eml.getMessageText(),
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris enim orci, semper vel egestas nec, tempor sit amet nunc. Quisque pulvinar eleifend massa, sit amet posuere lorem vehicula et. Nam elementum nulla eget nisl ultrices vulputate. Sed molestie ipsum at neque molestie tempor vel et augue. Nam magna velit, cursus sed lectus eu, bibendum viverra orci. Morbi quis risus sed nunc pharetra mattis. Suspendisse ut consectetur risus. Donec in suscipit purus, eget aliquet dui. In vitae suscipit est. Suspendisse sollicitudin, nisl sed scelerisque pulvinar, nibh mi viverra diam, et convallis nibh urna id sem. Nunc eros ante, semper sed ex vitae, iaculis tristique sapien. Maecenas molestie leo a iaculis viverra. Vivamus tristique enim vel ligula semper tristique et congue ex. Praesent auctor egestas augue ut molestie. Integer vulputate tortor quis tempor faucibus.\n\nCurabitur sed accumsan odio. Integer vestibulum in sem nec vestibulum. Donec imperdiet turpis a faucibus volutpat. Suspendisse varius rhoncus eros, non rutrum justo pellentesque sit amet. In risus lectus, blandit sit amet magna a, porttitor pulvinar justo. Curabitur tincidunt metus at luctus fermentum. Cras vehicula dui eget semper vulputate. Ut sed leo non arcu imperdiet ultrices et eu dolor. Vestibulum aliquet sed elit a gravida. Aenean vitae est nec tellus molestie fringilla in eget enim. Morbi sodales auctor erat, eget posuere nisl condimentum aliquet. Phasellus commodo metus aliquet vestibulum ultricies. Quisque eleifend in mi vitae imperdiet. Quisque sit amet luctus nisl, vel sagittis mi. Etiam tellus tortor, blandit ut eros quis, hendrerit iaculis eros.",
            );
        });
    });

    describe(basename(fixtures.cc), async () => {
        const eml = new EmlReader(await fs.readFile(fixtures.cc));

        it(eml.getTo.name, () => {
            assert.deepEqual(eml.getTo(), "Foo Bar <foo.bar@example.com>, info@example.com");
        });

        it(eml.getCc.name, () => {
            assert.deepEqual(eml.getCc(), "foo@example.com, Bar <bar@example.com>");
        });

        it(eml.getFrom.name, () => {
            assert.deepEqual(eml.getFrom(), "Foo Bar <foo.bar@example.com>");
        });
    });

    describe(basename(fixtures.multipart), async () => {
        const eml = new EmlReader(await fs.readFile(fixtures.multipart));

        it(eml.getAttachments.name, async () => {
            const attachments = eml.getAttachments();

            assert.deepEqual(attachments.length, 1);
            assert.deepEqual(attachments[0].filename, 'tired_boot.FJ010019.jpeg');
            assert.deepEqual(attachments[0].contentType, 'image/jpeg');

            const content = attachments[0].content;
            const expectedByteLength = 10442;

            assert(content instanceof ArrayBuffer);
            assert.deepEqual(content.byteLength, expectedByteLength);
            assert.deepEqual(attachments[0].filesize, content.byteLength);
            assert.deepEqual(Buffer.from(content), await fs.readFile('./src/_fixtures/tired_boot.FJ010019.jpeg'));
        });
    });
});
