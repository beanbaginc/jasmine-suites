/*
 * Jasmine Suites 2.0.
 *
 * This offers namespaced test suites for Jasmine 4.6+.
 *
 * Copyright (C) 2014-2023 Beanbag, Inc.
 *
 * Licensed under the MIT license.
 */
import 'jasmine';


console.assert(
    jasmine && jasmine.SuiteBuilder &&
    jasmine.SuiteBuilder.prototype.addSpecsToSuite_,
    'jasmine-suites is not compatible with this version of Jasmine');


let _curSuiteObj = null;
let _rootSuite = null;


/*
 * Information on a suite of tests.
 *
 * This is a fancy generator for Jasmine describe() calls, which allows for
 * taking a '/'-separated namespace of names and generating nested test suites.
 *
 * Subsequent calls that reuse any of these paths will have their tests added
 * to the suite. This makes it very easy to organize tests, making it much
 * easier to run subsets of tests across many files.
 */
const SuiteInfo = function(description) {
    this.description = description;
    this.specs = null;
    this.children = {};

    this._added = false;
    this._suiteObj = null;
};


/*
 * Returns a SuiteInfo for a key, creating one if necessary.
 *
 * The SuiteInfo will be added to this suite's list of children.
 */
SuiteInfo.prototype.getOrCreate = function(key, description) {
    var suite = this.children[key];

    if (!suite) {
        suite = new SuiteInfo(description);
        this.children[key] = suite;
    }

    return suite;
};


/*
 * Adds specs to this suite.
 *
 * The specs will either consist of a standard Jasmine specs function (if
 * the caller sets suite.specs), or a set of internally-generated describe()
 * calls.
 */
SuiteInfo.prototype._addSpecs = function() {
    var key;

    if (!this.specs) {
        for (key in this.children) {
            if (this.children.hasOwnProperty(key)) {
                this.children[key].describe(this);
            }
        }
    } else if (!this._added) {
        this.specs.call(this._suiteObj);
    }
};


/*
 * Runs a describe() for the suite.
 *
 * This will run through the tree of specs/suites and generate the set of
 * nested describe() calls. Each of these will be registered with Jasmine.
 *
 * The result will be a jasmine.Suite object.
 */
SuiteInfo.prototype.describe = function(parentSuiteInfo) {
    var self = this;

    if (self._added) {
        self._addSpecs();
    } else {
        describe(self.description, function() {
            var parentSuiteObj,
                oldParentSuiteObj,
                i;

            self._suiteObj = _curSuiteObj;
            console.assert(self._suiteObj);

            if (parentSuiteInfo) {
                parentSuiteObj = parentSuiteInfo._suiteObj;
                oldParentSuiteObj = self._suiteObj.parentSuite;

                if (oldParentSuiteObj !== parentSuiteObj) {
                    /*
                     * Remove the suite object from the old parent. This could
                     * potentially be slow, but in reality it's not going to
                     * have a large search space for most suites.
                     */
                    i = oldParentSuiteObj.children.indexOf(self._suiteObj);

                    if (i !== -1) {
                        oldParentSuiteObj.children.splice(i, 1);
                    }

                    /* Add the suite to the new parent and fix relations. */
                    parentSuiteObj.addChild(self._suiteObj);
                    self._suiteObj.parentSuite = parentSuiteObj;

                    /* Re-generate the full name of the suite. */
                    self._suiteObj.result.fullName =
                        self._suiteObj.getFullName();
                }
            }

            self._addSpecs();
            self._added = true;
        });
    }

    return self._suiteObj;
};


_rootSuite = new SuiteInfo();


/*
 * We need access to the suite objects, which we can no longer get with 'this'
 * above. So we need to monkey-patch the SuiteBuilder to capture this.
 */
const suiteBuilderProto = jasmine.SuiteBuilder.prototype;
const _addSpecsToSuite = suiteBuilderProto.addSpecsToSuite_;

suiteBuilderProto.addSpecsToSuite_ = function(suite, definitionFn) {
    _curSuiteObj = suite;

    return _addSpecsToSuite.call(this, suite, definitionFn);
};


/*
 * Defines a test suite with a nested, reusable namespace.
 *
 * The namespace consists of a '/'-separated list of names that the provided
 * specs of tests belong to. Each name in the list is equivalent to a
 * Jasmine describe() call, nested in the spec for the previous name, with
 * the exception these names can be reused across files.
 *
 * If more than one file has the same prefix for its namespace, those
 * describe() suites will be reused. This makes it really easy to categorize
 * tests under file paths, project names, or anything else, allowing those
 * related tests to be run together.
 */
export function suite(namespace, specs) {
    var parts = namespace.split('/'),
        parentSuite = _rootSuite,
        key = '',
        description,
        curSuite,
        firstSuite,
        i;

    for (i = 0; i < parts.length; i++) {
        description = parts[i];
        key += '/' + description;

        curSuite = parentSuite.getOrCreate(key, description);
        parentSuite = curSuite;

        if (!firstSuite) {
            firstSuite = curSuite;
        }
    }

    /* The last suite is the one that'll run the provided test specs. */
    curSuite.specs = specs;

    return firstSuite.describe();
};


jasmine.getGlobal().suite = suite;
