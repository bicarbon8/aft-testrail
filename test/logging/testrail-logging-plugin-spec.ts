import { TestRailLoggingPlugin } from "../../src/logging/testrail-logging-plugin";
import { RandomGenerator, TestLogLevel, EllipsisLocation, TestResult, TestStatus } from "aft-core";
import { TestRailApi } from "../../src/api/testrail-api";
import { TestRailResultRequest } from "../../src/api/testrail-result-request";
import { TestRailResultResponse } from "../../src/api/testrail-result-response";
import { TestRailConfig } from "../../src/configuration/testrail-config";

describe('TestRailLoggingPlugin', () => {
    beforeEach(() => {
        process.env.testrail_planid = RandomGenerator.getInt(999, 9999).toString();
    });

    afterEach(() => {
        delete process.env.testrail_planid;
        TestStore.caseId = undefined;
        TestStore.planId = undefined;
        TestStore.request = undefined;
    });

    it('holds on to the last 250 characters of logging', async () => {
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin();

        let expected: string = RandomGenerator.getString(249, true, true); // one short of 250 to account for added '\n'
        spyOn(plugin, 'level').and.returnValue(new Promise<TestLogLevel>((resolve) => {
            resolve(TestLogLevel.info);
        }));
        spyOn(plugin, 'enabled').and.returnValue(new Promise<boolean>((resolve) => {
            resolve(true);
        }));
        let getLogsSpy: jasmine.Spy<any> = spyOn<any>(plugin, 'getLogs').and.callThrough();

        await plugin.log(TestLogLevel.info, expected);

        let actual: string = getLogsSpy.call(plugin);
        expect(actual).toEqual(expected + '\n');
    });

    it('logging over 250 characters is ellided', async () => {
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin();

        let notExpected: string = RandomGenerator.getString(200, true, true);
        let expected: string = RandomGenerator.getString(249, true, true); // one short of 250 to account for added '\n'
        spyOn(plugin, 'level').and.returnValue(new Promise<TestLogLevel>((resolve) => {
            resolve(TestLogLevel.info);
        }));
        spyOn(plugin, 'enabled').and.returnValue(new Promise<boolean>((resolve) => {
            resolve(true);
        }));
        let getLogsSpy = spyOn<any>(plugin, 'getLogs').and.callThrough();

        await plugin.log(TestLogLevel.info, notExpected);
        await plugin.log(TestLogLevel.info, expected);

        let actual: string = getLogsSpy.call(plugin);
        expect(actual).toEqual(('foo' + expected).ellide(249, EllipsisLocation.beginning) + '\n');
    });

    it('converts a Failed result to Retry', async () => {
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin();
        spyOn(plugin, 'level').and.returnValue(new Promise<TestLogLevel>((resolve) => {
            resolve(TestLogLevel.info);
        }));
        spyOn(plugin, 'enabled').and.returnValue(new Promise<boolean>((resolve) => {
            resolve(true);
        }));

        let result: TestResult = new TestResult();
        result.TestId = 'C' + RandomGenerator.getInt(99, 999);
        result.TestStatus = TestStatus.Failed;

        let mockClient: TestRailApi = new TestRailApi();
        let clientSpy = spyOn(mockClient, 'addResult').and.callFake(async (caseId: string, request: TestRailResultRequest, planId: number): Promise<TestRailResultResponse[]> => {
            TestStore.caseId = caseId;
            TestStore.request = request;
            TestStore.planId = planId;
            return new Array<TestRailResultResponse>(0);
        });
        spyOn<any>(plugin, 'getClient').and.returnValue(mockClient);

        await plugin.logResult(result);

        expect(clientSpy).toHaveBeenCalledTimes(1);
        expect(TestStore.request.status_id).toEqual(4); // 4 is Retest
        expect(TestStore.caseId).toEqual(result.TestId);
        expect(TestStore.planId).not.toBeUndefined();
    });

    /**
     * WARNING: this test is only for local connectivity testing. it will
     * connect to an actual TestRail instance and submit a Retest result.
     */
    xit('sends actual TestResult to TestRail', async () => {
        /**
         * NOTE: first comment out the setting of the plan_id in the BeforeEach above
         * and then edit values in aftconfig.json before running this test
         */
        await TestRailConfig.write(true); // enable the logging plugin
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin();
        
        await plugin.log(TestLogLevel.error, RandomGenerator.getString(100));
        
        let testResult: TestResult = new TestResult();
        testResult.TestId = 'C3190'; // must be an existing TestRail Case ID
        testResult.TestStatus = TestStatus.Failed;
        testResult.ResultMessage = RandomGenerator.getString(100);

        await plugin.logResult(testResult);
    });
});

module TestStore {
    export var caseId: string;
    export var request: TestRailResultRequest;
    export var planId: number;
}