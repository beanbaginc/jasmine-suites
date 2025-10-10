/**
 * Jasmine Suites.
 *
 * This offers namespaced test suites for Jasmine.
 */

import {
    Suite,
    describe,
    jasmine,
} from 'jasmine-core';


/**
 * Information on a suite of tests.
 *
 * This is a fancy generator for Jasmine describe() calls, which allows for
 * taking a '/'-separated namespace of names and generating nested test suites.
 *
 * Subsequent calls that reuse any of these paths will have their tests added
 * to the suite. This makes it very easy to organize tests, making it much
 * easier to run subsets of tests across many files.
 */
class SuiteInfo {
    /** The description for the suite. */
    description: string | undefined;

    /** The specs which are part of this suite. */
    specs: (() => void) | null = null;

    /** A mapping from name to each of the child suites. */
    children: Record<string, SuiteInfo> = {};

    /** The parent suite, if any. */
    parentSuite: SuiteInfo | null = null;

    /** The jasmine suite object that corresponds to this SuiteInfo. */
    _suiteObj: Suite | null = null;

    /** Whether specs have been added already. */
    _added = false;

    /*
     * Construct the object.
     *
     * Args:
     *     description (string, optional):
     *         The description for the suite.
     */
    constructor(description?: string) {
        this.description = description;
    }

    /**
     * Return a SuiteInfo for a key, creating one if necessary.
     *
     * The SuiteInfo will be added to this suite's list of children.
     *
     * Args:
     *     key (string):
     *         The key for the suite.
     *
     *     description (string):
     *         The description for the suite.
     *
     * Returns:
     *     SuiteInfo:
     *     The suite for the key.
     */
    getOrCreate(
        key: string,
        description: string,
    ): SuiteInfo {
        let suite = this.children[key];

        if (!suite) {
            suite = new SuiteInfo(description);
            this.children[key] = suite;
        }

        return suite;
    }

    /**
     * Add specs to this suite.
     *
     * The specs will either consist of a standard Jasmine specs function (if
     * the caller sets suite.specs), or a set of internally-generated
     * describe() calls.
     */
    _addSpecs() {
        if (!this.specs) {
            for (const value of Object.values(this.children)) {
                value.describe(this);
            }
        } else if (!this._added) {
            this.specs.call(this._suiteObj);
        }
    }

    /**
     * Run a describe() for the suite.
     *
     * This will run through the tree of specs/suites and generate the set of
     * nested describe() calls. Each of these will be registered with Jasmine.
     *
     * The result will be a jasmine.Suite object.
     *
     * Args:
     *     parentSuiteInfo (SuiteInfo, optional):
     *         The info object for parent suite, if the suite has a parent.
     *
     * Returns:
     *     SuiteInfo:
     *     The suite info object.
     */
    describe(
        parentSuiteInfo?: SuiteInfo,
    ): SuiteInfo | null {
        if (this._added) {
            this._addSpecs();
        } else {
            describe(this.description, () => {
                this._suiteObj = _curSuiteObj;
                console.assert(this._suiteObj);

                if (parentSuiteInfo) {
                    const parentSuiteObj = parentSuiteInfo._suiteObj;
                    const oldParentSuiteObj = _curSuiteObj.parentSuite;

                    if (oldParentSuiteObj !== parentSuiteObj) {
                        /*
                         * Remove the suite object from the old parent. This
                         * could potentially be slow, but in reality it's not
                         * going to have a large search space for most suites.
                         */
                        const i = oldParentSuiteObj.children.indexOf(
                            this._suiteObj);

                        if (i !== -1) {
                            oldParentSuiteObj.children.splice(i, 1);
                        }

                        /*
                         * Add the suite to the new parent and fix relations.
                         */
                        parentSuiteObj.addChild(this._suiteObj);
                        this._suiteObj.parentSuite = parentSuiteObj;

                        /* Re-generate the full name of the suite. */
                        this._suiteObj.result.fullName =
                            this._suiteObj.getFullName();
                    }
                }

                this._addSpecs();
                this._added = true;
            });
        }

        return this._suiteObj;
    }
}


const _rootSuite = new SuiteInfo();
let _curSuiteObj: Suite;


/*
 * We need access to the suite objects, which we can no longer get with 'this'
 * above. So we need to monkey-patch the SuiteBuilder to capture this.
 */
const suiteBuilderProto = jasmine.SuiteBuilder.prototype;
const _addSpecsToSuite = suiteBuilderProto.addSpecsToSuite_;

suiteBuilderProto.addSpecsToSuite_ = function(
    suite: Suite,
    definitionFn: () => void,
) {
    _curSuiteObj = suite;

    return _addSpecsToSuite.call(this, suite, definitionFn);
};


/**
 * Define a test suite with a nested, reusable namespace.
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
 *
 * Args:
 *     namespace (string):
 *         The namespace for the suite.
 *
 *     specs (function):
 *         The function which defines the test specs.
 */
export function suite(
    namespace: string,
    specs: () => void,
) {
    let parentSuite = _rootSuite;
    let key = '';
    let firstSuite: SuiteInfo | null = null;
    let curSuite: SuiteInfo | null = null;

    for (const description of namespace.split('/')) {
        key += '/' + description;

        curSuite = parentSuite.getOrCreate(key, description);
        parentSuite = curSuite;

        if (!firstSuite) {
            firstSuite = curSuite;
        }
    }

    /* The last suite is the one that'll run the provided test specs. */
    if (!(curSuite instanceof SuiteInfo)) {
        throw new Error('Current suite was not set');
    }

    curSuite.specs = specs;

    if (!(firstSuite instanceof SuiteInfo)) {
        throw new Error('firstSuite was not set');
    }

    return firstSuite.describe();
}


jasmine.getGlobal().suite = suite;
