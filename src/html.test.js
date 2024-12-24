// @ts-check

import { describe } from "node:test";
import assert from "node:assert/strict";
import { htmlToPlainText, plainTextToHtml } from "./html.js";

describe(htmlToPlainText.name, () => {
    assert.equal(
        htmlToPlainText(`
            <h1>heading</h1>

            <p>hello world</p>

            <p>
                para
                <br>
                with
                <span>
                    break
                </span>
            </p>
        `),
        'heading\n\nhello world\n\npara\nwith break',
    );

    assert.equal(
        htmlToPlainText(`<h1>heading</h1><p>hello world</p><p>para<br>with <span>break</span></p>`),
        'heading\n\nhello world\n\npara\nwith break',
    );

    assert.equal(
        htmlToPlainText(`<h1>hello &gt;&lt;&quot;&#39;&apos;&nbsp;</h1>`),
        `hello ><"''\xa0`,
    );
});

describe(plainTextToHtml.name, () => {
    assert.equal(
        plainTextToHtml(`hello ><"''\xa0\nworld`),
        `hello &gt;&lt;&quot;&#39;&#39;&nbsp;<br />world`,
    );
});
