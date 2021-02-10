# AFT-TestRail
provides TestRail result logging as well as test execution filtering for users of `aft-core` by implementing plugins for the `ILoggingPlugin` and `ITestCaseHandlerPlugin` interfaces.

## ILoggingPlugin
the `TestRailLoggingPlugin` implements the `ILoggingPlugin` in `aft-core`. if enabled, this plugin will log test results to test cases in a TestRail Plan (if no plan is specified a new one is created). it can be enabled by including the following in your `aftconfig.json` file:

```json
{
    ...
    "logging": {
        "pluginNames": [
            ...
            "./node_modules/aft-testrail/dist/src/logging/testrail-logging-plugin"
        ]
    },
    ...
    "testrail": {
        "url": "https://your.testrail.instance/",
        "user": "valid.user@testrail.instance",
        "access_key": "your_access_key",
        "write": true,
        "plan_id": 12345
    }
    ...
}
```

## ITestCaseHandlerPlugin
the `TestRailTestCaseHandlerPlugin` implements the `ITestCaseHandlerPlugin` interface in `aft-core`. if enabled this plugin will lookup the status of TestRail tests based on their case ID from the AFT `testCases` array passed in to a `should` or `TestWrapper`. it can be enabled by including the following in your `aftconfig.json` file:

```json
{
    ...
    "testCaseManager": {
        "pluginName": "./node_modules/aft-testrail/dist/src/integration/test-case/testrail-test-case-handler-plugin"
    },
    ...
    "testrail": {
        "url": "https://your.testrail.instance/",
        "user": "valid.user@testrail.instance",
        "access_key": "your_access_key",
        "read": true,
        "plan_id": 12345
    }
    ...
}
```

## Configuration
to submit results to or filter test execution based on existence and status of tests in TestRail, you will need to have an account with write permissions in TestRail. These values can be specified in your `aftconfig.json` as follows:

```json
{
    ...
    "testrail": {
        "url": "http://fake.testrail.io",
        "user": "your.email@your.domain.com",
        "access_key": "your_testrail_api_key_or_password",
        "logging_level": "warn",
        "read": true,
        "write": true,
        "project_id": 3,
        "suite_ids": [1219, 744],
        "plan_id": 12345,
        "max_log_characters": 100
    }
    ...
}
```
- **url** - [REQUIRED] the full URL to your instance of TestRail. _(NOTE: this is **NOT** the API URL, just the base domain name)_
- **user** - [REQUIRED] the email address of the user that will submit test results
- **access_key** - [REQUIRED] the access key (or password) for the above user
- **logging_level** - the minimum level of logs to capture and send with any `TestResult` _(defaults to 250)_
- **read** - if set to `true` then test execution control is based on finding a matching test case ID in the `TestWrapper` or `should` clause used to execute an expectation. _(defaults to `false`)_
- **write** - if set to `true` then test results will be written to a TestRail plan. _(defaults to `false`)_
- **project_id** - the TestRail project containing test suites to be used in test execution. _(Required only if `plan_id` is not set)_
- **suite_ids** - an array of TestRail suites containing test cases to be used in test execution. _(Required only if `plan_id` is not set)_
- **plan_id** - an existing TestRail Plan to be used for logging test results if `write` is `true` and used for controlling execution of tests if `read` is `true`. _(NOTE: if no value is specified for `plan_id` and `write` is set to `true`, a new TestRail Plan will be created using the suites specified in `suite_ids` and the `project_id`)_
- **max_log_characters** - the maximum number of log message characters to send with any non passing result _(defaults to 250)_

## Usage
you can submit results directly by calling the `aft-core.TestLog.logResult(result: TestResult)` function or results will automatically be submitted if using the `aft-core.should(expectation, options)` with valid `testCases` specified in the `options` object. 

----

**NOTE: sending a `ITestResult` with a `TestStatus` of `Failed` will be converted to a status of `Retest` before submitting to TestRail**

----

### via `aft-core.TestLog`:
```typescript
let logger: TestLog = new TestLog({name: 'sample logger'});
await logger.logResult({
    testId: 'C3190', // must be an existing TestRail Case ID contained in your referenced TestRail Plan ID
    status: TestStatus.Failed,
    resultMessage: 'there was an error when running this test'
});
```

### via `aft-core.should` (`aft-core.TestWrapper`):
```typescript
/** 
 * `TestStatus.Retest` result for `C3190`, `C2217763`, and `C3131` sent to TestRail
 * following execution because expectation fails
 */
await should(() => expect(1 + 1).toBe(3), { 
    testCases: ['C3190', 'C2217763', 'C3131'],
    description: 'expected to fail because 1+1 != 3'
});
```
