Namespaced Jasmine Suites
=========================

Overview
--------

This extends [Jasmine](https://jasmine.github.io/) 1.4.x by making it
easy to create nested, reusable namespaces for test suites.

Typically, a large codebase using Jasmine will split tests into multiple files,
each with a `describe()` call wrapping the file's tests. This works fine for
small sets of tests, but on a larger codebase, it leaves much to be desired.
There's no way to organize tests across files under a common suite, or to
limit the test run to those tests.

Namespaced suites solve this by taking a namespaced path (something like
`projectname/mysuite/component`) and automatically generating test suites for
each component of the namespace. It will also merge any tests in that
refer to the same parts of the namespace from other files.


Usage
-----

Switching to namespaced suites is really easy. Instead of doing this:

```javascript
describe('projectname/mysuite/component', function() {
    ...
});
```

or:

```javascript
describe('projectname', function() {
    describe('mysuite', function() {
        describe('component', function() {
           ...
        });
    });
});
```

You can instead do:

```javascript
suite('projectname/mysuite/component', function() {
   ...
});
```

You can reuse any part of that namespace in as many files as you like. Their
tests will be combined into the suites.

For example, say you have the following:

```javascript
// tests1.js
suite('projectname/models/MyModel', function() {
   ...
});

suite('projectname/views/MyView', function() {
   ...
});


// tests2.js
suite('projectname/views/AnotherView', function() {
   ...
});
```

Jasmine will end up laying out the tests like:

    projectname

        models

        views

            MyView

            AnotherView


Where is this used?
-------------------

We use jasmine-suites at [Beanbag](http://www.beanbaginc.com/) for our
[Review Board](http://www.reviewboard.org/) and
[RBCommons](https://rbcommons.com/) products.

If you use jasmine-suites, let us know and we'll add you to a shiny new list on
this page.


License
-------

Jasmine Suites is under the MIT license.
