const { posix: { join } } = require('path');

/* If config.json does not exist, create target from the default config file.
 * If config.json does exist, do nothing.
 */

const { existsSync, copyFileSync, constants } = require('fs');

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const target = "./src/config.json";
const source = "./src/default-config.json";

if (! existsSync(target)) {
    // Copy the file, failing if it exists, since that would be an error.
    copyFileSync(source, target, constants.COPYFILE_EXCL);
}

process.exit(0);
