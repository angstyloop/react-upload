/** Tests whether or not `target` is an "object" from the perspective of the
 * apply function.
 */
function isObject(target) {
    if (target === undefined || target === null) {
        return false;
    }

    if (Object.getPrototypeOf(target) !== Object.prototype) {
        // Comment this line to treat Arrays like scalar values instead of
        // objects.
        if (Object.getPrototypeOf(target) === Array.prototype) { return true; }

        return false;
    }

    return true;
}

module.exports = isObject;

// TEST

function test_isObject() {
    [
        () => {
            console.log([0], isObject({}) ? 'PASS' : 'FAIL', '{} is an object.');
            console.log([1], isObject([]) ? 'PASS' : 'FAIL', '[] is an object.');
            console.log([2], !isObject(()=>true) ? 'PASS' : 'FAIL', '()=>true is not an object.');
            console.log([3], !isObject('') ? 'PASS' : 'FAIL', '"" is not an object.');
            console.log([4], !isObject(0) ? 'PASS' : 'FAIL', '0 is not an object.');
            console.log([5], !isObject(false) ? 'PASS' : 'FAIL', 'false is not an object.');
            console.log([6], !isObject(undefined) ? 'PASS' : 'FAIL', 'false is not an object.');
            console.log([7], !isObject(null) ? 'PASS' : 'FAIL', 'false is not an object.');
        },
        () => {},
    ].map(fn => fn());
}

//test_isObject();
