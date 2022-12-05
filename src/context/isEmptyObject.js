const isObject = require('./isObject');

function isEmptyObject(it) {
    return isObject(it) && Object.keys(it).length === 0;
}

module.exports = isEmptyObject;

// TEST

function test_isEmptyObject() {
    [
        () => {
            console.log([0], isEmptyObject({}) ? 'PASS' : 'FAIL',
                    '{} is an empty object.');
        },

        () => {
            console.log([1], isEmptyObject([]) ? 'PASS' : 'FAIL',
                    '[] is an empty object.');
        },

        () => {

            console.log([2], !isEmptyObject({0:0}) ? 'PASS' : 'FAIL',
                    '{0:0} is not an empty object.');
        },

        () => {
            console.log([3], !isEmptyObject([0,0]) ? 'PASS' : 'FAIL',
                    '[0,0] is not an empty object.');
        },

    ].map(fn => fn());
}

//test_isEmptyObject();
