/**
 * Returns key absolute application paths to any file that imports this script.
 */

import Path from 'path';
import { fileURLToPath as FileURLToPath } from 'url';

const appdir = Path.dirname(FileURLToPath(import.meta.url));

export default function getRootPaths() {
    const filename = FileURLToPath(import.meta.url);
    const dirname = Path.dirname(filename);
    return { APPDIR: appdir, DIRNAME: dirname, FILENAME: filename };
}
