// @ts-nocheck
const got = require('got');
const zlib = require('zlib');

const API_URL = 'https://tio.run/cgi-bin/run/api/';
const languages = require('./languages.json');

/**
 * @param {string} code
 * @param {string} language
 * @param {Record<string, unknown>} options
 */
async function run(code, language, options = {}) {
    let files = { ".code.tio": String(code) }, variables = { "lang": language };
    if (options.input != null) files[".input.tio"] = String(options.input);
    if (options.args != null) variables["args"] = options.args;
    if (options.flags != null) variables["TIO_CFLAGS"] = options.flags;
    let plain = '';
    for (const k in variables) {
        plain += `V${k}\0`;
        let v = variables[k];
        if (!Array.isArray(v)) v = [v];
        plain += `${v.length}\0`;
        for (const x of v) plain += `${x}\0`;
    }
    for (const k in files) {
        let v = files[k];
        plain += `F${k}\0${Buffer.byteLength(v)}\0${v}`;
    }
    plain += 'R';
    const buf = zlib.deflateRawSync(plain);
    const { body } = await got.post(API_URL, { body: buf });
    const splitter = body.substring(0, 16);
    const [out, err] = body.substring(16).split(splitter);
    return { out, err };
}

module.exports = {
    languages,
    run
};
