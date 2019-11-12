# AFT-TestRail
provides TestRail result logging for users of `aft-core` with an eventual plan to support TestRail Test Plan creation and test execution filtering as well.

## Configuration
to submit results to TestRail, you will currently need to have a valid Test Plan ID and an account with write permissions in TestRail. These values can be specified in your `aftconfig.json` as follows:

```json
{
    "testrail_loglevel": "warn",
    "testrail_write": "true",
    "testrail_url": "http://your-instance.testrail.io",
    "testrail_user": "your.email@your.domain.com",
    "testrail_encoded_pass": "your_base64_encoded_testrail_password",
    "testrail_planid": "12345",
    "testrail_maxlogchars": "250"
}
```
- *testrail_loglevel* - the minimum level of logs to capture and send with any `TestResult` (NOTE: a maximum of 250 characters is supported by default)
- *testrail_write* - if set to `"true"` this logging plugin will be used by `aft-core.TestLog`
- *testrail_url* - the full URL to your instance of TestRail
- *testrail_user* - the email address of the user to be used when submitting results
- *testrail_encoded_pass* - the Base64 encoded password for the above user
- *testrail_planid* - the TestRail Plan containing the tests to be updated
- *testrail_maxlogchars* - the maximum number of log message characters to send with any non passing result (NOTE: TestRail imposes it's own limit on this value)

## Usage
you can submit results either directly through the `TestRailLoggingPlugin` class or indirectly via the `aft-core.TestLog.logResult(result: TestResult)` function. 

#### NOTE: sending a `TestResult` with a `TestStatus` of `Failed` will be converted to a status of `Retest` before submitting to TestRail

### via `aft-core.TestLog`:
```typescript
let options: TestLogOptions = new TestLogOptions('logger name');
let logger: TestLog = new TestLog(options);

let result: TestResult = new TestResult();
testResult.TestId = 'C3190'; // must be an existing TestRail Case ID contained in your referenced TestRail Plan ID
testResult.TestStatus = TestStatus.Failed;
testResult.ResultMessage = 'there was an error when running this test';

await logger.logResult(result);
```

### via `aft-core.TestWrapper`:
```typescript
let options: TestWrapperOptions = new TestWrapperOptions('unique test name');
options.testCases.addRange('C3190', 'C2217763', 'C3131');
await using(new TestWrapper(options), async (tw) => {
    // send Passed result to TestRail
    tw.addTestResult('C3131', TestStatus.Passed, 'optional message');

    // send Retest result to TestRail
    tw.check('C2217763', () => {
        throw new Error('an exception happened in testing');
    });
}); // Retest result for C3131 sent to TestRail on exiting using block because no other result submitted for it previously and an Error was caught inside a tw.check call
```