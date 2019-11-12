import { TestRailConfig } from "../../src/configuration/testrail-config";

describe('TestRailConfig', () => {
    beforeEach(() => {
        delete process.env[TestRailConfig.TESTRAIL_URL_KEY];
        delete process.env[TestRailConfig.TESTRAIL_SUITEIDS_KEY];
    });

    it('can get the url from aftconfig.json file', async () => {
        let expectedUrl: string = 'http://fake.testrail.ie';
        let url: string = await TestRailConfig.url(expectedUrl);

        expect(url).toEqual(expectedUrl);
    });

    it('can override the url using environment var', async () => {
        process.env[TestRailConfig.TESTRAIL_URL_KEY] = 'invalid value';

        let url: string = await TestRailConfig.url();

        expect(url).toEqual('invalid value');
    });

    it('Max Log Characters defaults to 250', async () => {
        let max: number = await TestRailConfig.maxLogCharacters();
        
        expect(max).toEqual(250);
    });

    it('can parse multiple suite IDs', async () => {
        let suiteIds: number[] = await TestRailConfig.suiteIds([123, 456, 789]);

        expect(suiteIds.length).toEqual(3);
        expect(suiteIds[0]).toEqual(123);
        expect(suiteIds[1]).toEqual(456);
        expect(suiteIds[2]).toEqual(789);

        process.env[TestRailConfig.TESTRAIL_SUITEIDS_KEY] = '987 654';

        suiteIds = await TestRailConfig.suiteIds();

        expect(suiteIds.length).toEqual(2);
        expect(suiteIds[0]).toEqual(987);
        expect(suiteIds[1]).toEqual(654);
    });
});