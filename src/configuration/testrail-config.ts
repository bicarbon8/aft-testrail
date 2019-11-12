import { TestConfig, TestLogLevel, Convert } from "aft-core";

export module TestRailConfig {
    export const TESTRAIL_LOGLEVEL_KEY = 'testrail_loglevel';
    export const TESTRAIL_USER_KEY = 'testrail_user';
    export const TESTRAIL_PASS_KEY = 'testrail_encoded_pass';
    export const TESTRAIL_URL_KEY = 'testrail_url';
    export const TESTRAIL_MAXLOGCHARS_KEY = 'testrail_maxlogchars';
    export const TESTRAIL_PROJECTID_KEY = 'testrail_projectid';
    export const TESTRAIL_SUITEIDS_KEY = 'testrail_suiteids';
    export const TESTRAIL_PLANID_KEY = 'testrail_planid';
    export const TESTRAIL_WRITE_KEY = 'testrail_write';
    
    export async function loggingLevel(level?: TestLogLevel): Promise<TestLogLevel> {
        if (level) {
            TestConfig.setGlobalValue(TestRailConfig.TESTRAIL_LOGLEVEL_KEY, level.name);
        }
        let levelStr = await TestConfig.getValueOrDefault(TestRailConfig.TESTRAIL_LOGLEVEL_KEY, TestLogLevel.error.name);
        if (levelStr) {
            return TestLogLevel.parse(levelStr);
        }
        return TestLogLevel.error;
    }

    export async function user(user?: string): Promise<string> {
        if (user) {
            TestConfig.setGlobalValue(TestRailConfig.TESTRAIL_USER_KEY, user);
        }
        return await TestConfig.getValueOrDefault(TestRailConfig.TESTRAIL_USER_KEY);
    }

    /**
     * gets and sets the password to be used for accessing TestRail. when reading
     * from configuration, the password should be base64 encoded. this function
     * will decode the password and return it as plaintext
     * @param pass an optional plaintext password to be base64 encoded and set as an
     * environment variable under the 'TESTRAIL_PASS_KEY' key
     */
    export async function password(pass?: string): Promise<string> {
        if (pass) {
            let encodedPass: string = Convert.toBase64Encoded(pass);
            TestConfig.setGlobalValue(TestRailConfig.TESTRAIL_PASS_KEY, encodedPass);
        }
        let encodedPass: string = await TestConfig.getValueOrDefault(TestRailConfig.TESTRAIL_PASS_KEY);
        if (encodedPass) {
            return Convert.fromBase64Encoded(encodedPass);
        }
        return null;
    }

    export async function url(url?: string): Promise<string> {
        if (url) {
            TestConfig.setGlobalValue(TestRailConfig.TESTRAIL_URL_KEY, url);
        }
        return await TestConfig.getValueOrDefault(TestRailConfig.TESTRAIL_URL_KEY);
    }

    export async function maxLogCharacters(maxLogChars?: number): Promise<number> {
        if (maxLogChars) {
            TestConfig.setGlobalValue(TestRailConfig.TESTRAIL_MAXLOGCHARS_KEY, maxLogChars.toString());
        }
        let maxStr: string = await TestConfig.getValueOrDefault(TestRailConfig.TESTRAIL_MAXLOGCHARS_KEY);
        let max: number = 250;
        if (maxStr) {
            max = +maxStr; // magic to parse string to number without chance of NaN result
        }
        return max;
    }

    export async function projectId(projId?: number): Promise<number> {
        if (projId) {
            TestConfig.setGlobalValue(TESTRAIL_PROJECTID_KEY, projId.toString());
        }
        let pIdStr: string = await TestConfig.getValueOrDefault(TESTRAIL_PROJECTID_KEY);
        let pId: number = 0;
        if (pIdStr) {
            pId = +pIdStr; // magic to parse string to number without chance of NaN result
        }
        return pId;
    }

    export async function suiteIds(suites?: number[]): Promise<number[]> {
        if (suites) {
            TestConfig.setGlobalValue(TESTRAIL_SUITEIDS_KEY, suites.join(' '));
        }
        let sIdsStr: string = await TestConfig.getValueOrDefault(TESTRAIL_SUITEIDS_KEY);
        let sIds: number[] = [];
        if (sIdsStr) {
            let sIdsArray: string[] = sIdsStr.split(' ');
            for (var i=0; i<sIdsArray.length; i++) {
                sIds.push(+sIdsArray[i]); // magic to parse string to number without chance of NaN result
            }
        }
        return sIds;
    }

    export async function planId(planId?: number): Promise<number> {
        if (planId) {
            TestConfig.setGlobalValue(TESTRAIL_PLANID_KEY, planId.toString());
        }
        let pIdStr: string = await TestConfig.getValueOrDefault(TESTRAIL_PLANID_KEY);
        let pId: number = 0;
        if (pIdStr) {
            pId = +pIdStr; // magic to parse string to number without chance of NaN result
        }
        return pId;
    }

    export async function write(writeEnabled?: boolean): Promise<boolean> {
        if (writeEnabled) {
            TestConfig.setGlobalValue(TESTRAIL_WRITE_KEY, writeEnabled.toString());
        }
        let enabledStr: string = await TestConfig.getValueOrDefault('testrail_write', 'false');
        if (enabledStr.toLocaleLowerCase() == 'true') {
            return true;
        }
        return false;
    }
}