import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const extensionDir = join(root, 'extension');
const schemaPath = join(extensionDir, 'schemas', 'org.gnome.shell.extensions.jigglewiggle.gschema.xml');
const metadataPath = join(extensionDir, 'metadata.json');
const versionPath = join(root, 'VERSION');
const packagePath = join(root, 'package.json');

const uuid = 'jigglewiggle@nikitakhutorni.github.io';
const schemaId = 'org.gnome.shell.extensions.jigglewiggle';

const metadata = readJsonFile(metadataPath);
const packageJson = readJsonFile(packagePath);
const version = readFileSync(versionPath, 'utf8').trim();
const schema = readFileSync(schemaPath, 'utf8');

assert.equal(metadata.uuid, uuid, 'metadata UUID must match install directory name');
assert.equal(metadata.name, 'jigglewiggle');
assert.deepEqual(metadata['shell-version'], ['50']);
assert.equal(metadata['settings-schema'], schemaId);
assert.equal(metadata['version-name'], version);
assert.equal(packageJson.version, version);
assert.match(version, /^(?:0|[1-9]\d*)\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/);

for (const file of [
    'extension.js',
    'assets/pointer.svg',
    'cursorSizeEffect.js',
    'overlay.js',
    'pointerSampler.js',
    'prefs.js',
    'settings.js',
    'stylesheet.css',
    'wiggleDetector.js',
]) {
    assert.ok(existsSync(join(extensionDir, file)), `missing extension/${file}`);
}

assert.match(schema, new RegExp(`<schema id="${schemaId}"`));
assert.match(schema, /<key name="enabled" type="b">/);
assert.match(schema, /<key name="effect-mode" type="s">/);
assert.match(schema, /<choice value="animated-pointer"\/>/);
assert.doesNotMatch(schema, /<choice value="overlay"\/>/);
assert.match(schema, /<key name="sensitivity" type="s">/);
assert.match(schema, /<key name="max-scale" type="d">/);
assert.match(schema, /<key name="peak-hold-ms" type="i">/);
assert.match(schema, /<key name="pointer-opacity" type="d">/);
assert.match(schema, /<key name="hide-system-cursor" type="b">/);
assert.match(schema, /Deprecated hide system cursor/);
assert.match(schema, /Deprecated show halo/);
assert.match(schema, /<key name="respect-reduced-motion" type="b">/);

const extensionSource = readFileSync(join(extensionDir, 'extension.js'), 'utf8');
assert.doesNotMatch(extensionSource, /\bimports\./, 'extension.js should use ES module imports');
assert.match(extensionSource, /extends Extension/, 'extension must subclass Extension');
assert.doesNotMatch(extensionSource, /effectMode === ['"]overlay['"]/,
    'runtime should not branch on removed overlay effect mode');
assert.doesNotMatch(extensionSource, /CursorVisibility|inhibit_cursor_visibility/,
    'animated pointer mode must not hide or inhibit the real cursor');

console.log(`jigglewiggle ${version} project metadata is valid.`);

function readJsonFile(path) {
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
        throw new Error(`Invalid JSON in ${path}: ${error.message}`, {
            cause: error,
        });
    }
}
