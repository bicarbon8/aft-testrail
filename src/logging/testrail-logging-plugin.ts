import { ILoggingPlugin, TestLogLevel, TestResult, TestLog, TestStatus, TestResultMetaData, EllipsisLocation } from "aft-core";
import { TestRailConfig } from "../configuration/testrail-config";
import { TestRailApi } from "../api/testrail-api";
import { TestRailResultRequest } from "../api/testrail-result-request";
import 'aft-core/dist/src/extensions/string-extensions';

export class TestRailLoggingPlugin implements ILoggingPlugin {
    name: string = 'testrail';
        
    private logs: string = '';
    private client: TestRailApi;

    constructor() {
        this.consoleLog('creating logging plugin instance.')
        this.client = new TestRailApi();
    }

    async planId(): Promise<number> {
        return await TestRailConfig.planId();
    }

    async level(): Promise<TestLogLevel> {
        return await TestRailConfig.loggingLevel();
    }

    async enabled(): Promise<boolean> {
        return await TestRailConfig.write();
    }
    
    async log(level: TestLogLevel, message: string): Promise<void> {
        let l: TestLogLevel = await this.level();
        if (level.value >= l.value) {
            this.logs += message + '\n';
            this.logs = this.logs.ellide(await TestRailConfig.maxLogCharacters(), EllipsisLocation.beginning);
        }
    }
    
    async logResult(result: TestResult): Promise<void> {
        await this.getClient().addResult(result.TestId, await this.getTestRailResultForExternalResult(result), await this.planId());
    }

    async finalise(): Promise<void> {
        /* do nothing */
    }

    private getLogs(): string {
        return this.logs;
    }

    private getClient(): TestRailApi {
        return this.client;
    }

    private async getTestRailResultForExternalResult(result: TestResult): Promise<TestRailResultRequest> {
        let trResult: TestRailResultRequest = new TestRailResultRequest();

        trResult.comment = new String(this.getLogs() + '\n' + result.ResultMessage).ellide(await TestRailConfig.maxLogCharacters(), EllipsisLocation.beginning);
        if (result.MetaData[TestResultMetaData[TestResultMetaData.DurationMs]]) {
            trResult.elapsed = result.MetaData[TestResultMetaData[TestResultMetaData.DurationMs]];
        }
        trResult.defects = result.Issues.join(',');
        switch (result.TestStatus) {
            case TestStatus.Skipped:
                trResult.status_id = 9;
                break;
            case TestStatus.Untested:
                trResult.status_id = 3;
                break;
            case TestStatus.Blocked:
                trResult.status_id = 2;
                break;
            case TestStatus.Passed:
                trResult.status_id = 1;
                break;
            case TestStatus.Failed:
            case TestStatus.Retest:
            default:
                    trResult.status_id = 4;
                    break;
        }

        return trResult;
    }

    private async consoleLog(message: string): Promise<void> {
        let level: TestLogLevel = await this.level();
        if (level.value <= TestLogLevel.trace.value && level != TestLogLevel.none) {
            console.log(TestLog.format(this.name, TestLogLevel.trace, message));
        }
    }
}