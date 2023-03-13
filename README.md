# eml-parser
a simple javascript parser to read .eml (E-Mail) files

# demo
check https://raw.githack.com/netas-ch/eml-parser/main/_test/test.html for a demo.

# usage
    const emlr = await import('src/EmlReader.js');
    const email = new emlr.EmlReader(fileAsArrayBuffer);

    console.log(email.getDate());
    console.log(email.getSubject());
    console.log(email.getFrom());
    console.log(email.getCc());
    console.log(email.getTo());
    console.log(email.getReplyTo());

# license
Copyright © 2023 Netas AG - MIT license