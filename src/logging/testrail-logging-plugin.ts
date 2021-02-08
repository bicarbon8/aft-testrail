import { ILoggingPlugin, LoggingLevel, ITestResult, TestLog, TestStatus, EllipsisLocation } from "aft-core";
import { TestRailApi } from "../api/testrail-api";
import { TestRailResultRequest } from "../api/testrail-result-request";
import 'aft-core/dist/src/extensions/string-extensions';
import { TestRailPlan } from "../api/testrail-plan";
import { TestRailConfig } from "../configuration/testrail-config";
import { ConsoleLogger } from "./console-logger";
import { StatusConverter } from "../helpers/status-converter";

export class TestRailLoggingPlugin implements ILoggingPlugin {
    name: string = 'testrail';
        
    private _logs: string = '';
    private _config: TestRailConfig;
    private _client: TestRailApi;
    
    constructor(config?: TestRailConfig, client?: TestRailApi) {
        this._config = config || TestRailConfig.instance;
        this._client = client || new TestRailApi(this._config);
    }

    async isEnabled(): Promise<boolean> {
        return await this._config.getWrite();
    }

    async onLoad(): Promise<void> {
        // create new Test Plan if one doesn't already exist
        if (await this.isEnabled() && (await this._config.getPlanId() <= 0)) {
            let projectId: number = await this._config.getProjectId();
            let suiteIds: number[] = await this._config.getSuiteIds();
            await ConsoleLogger.log(`creating new TestRail plan in project '${projectId}' using suites [${suiteIds.join(',')}]`);
            let plan: TestRailPlan = await this._client.createPlan(projectId, suiteIds);
            this._config.setPlanId(plan.id);
        }
    }

    async level(): Promise<LoggingLevel> {
        return this._config.getLoggingLevel();
    }

    async log(level: LoggingLevel, message: string): Promise<void> {
        if (await this.isEnabled()) {
            let l: LoggingLevel = await this.level();
            if (level.value >= l.value) {
                if (this._logs.length > 0) {
                    this._logs += '\n'; // separate new logs from previous
                }
                this._logs += message;
                this._logs = this._logs.ellide(await this._config.getMaxLogCharacters(), EllipsisLocation.beginning);
            }
        }
    }
    
    async logResult(result: ITestResult): Promise<void> {
        if (await this.isEnabled() && result) {
            let planId: number = await this._config.getPlanId();
            let trResult: TestRailResultRequest = await this._getTestRailResultForExternalResult(result);
            await this._client.addResult(result.testId, planId, trResult);
            await ConsoleLogger.log(`'${trResult.status_id}' result sent to TestRail for test id: ${result.testId}`);
        }
    }

    async finalise(): Promise<void> {
        /* do nothing */
    }

    private _getLogs(): string {
        return this._logs;
    }

    private async _getTestRailResultForExternalResult(result: ITestResult): Promise<TestRailResultRequest> {
        let maxChars: number = await this._config.getMaxLogCharacters();
        let elapsed: number = 0;
        if (result.metadata) {
            let millis: number = result.metadata['durationMs'] || 0;
            elapsed = Math.floor(millis / 60000); // elapsed is in minutes
        }
        let trResult: TestRailResultRequest = {
            comment: new String(`${this._getLogs()}\n${result.resultMessage}`).ellide(maxChars, EllipsisLocation.beginning),
            defects: result.defects?.join(','),
            elapsed: elapsed.toString(),
            status_id: StatusConverter.instance.toTestRailStatus(result.status)
        };

        return trResult;
    }
}