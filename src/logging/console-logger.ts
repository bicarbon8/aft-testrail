import { LoggingLevel, TestLog } from 'aft-core';
import { TestRailConfig } from '../configuration/testrail-config';

export module ConsoleLogger {
    export async function log(message: string): Promise<void> {
        let level: LoggingLevel = await TestRailConfig.instance.getLoggingLevel();
        if (level.value <= LoggingLevel.trace.value && level.value != LoggingLevel.none.value) {
            console.log(TestLog.format('testrail', LoggingLevel.trace, message));
        }
    }
}