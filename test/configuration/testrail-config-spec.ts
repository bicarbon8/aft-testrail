import { TestConfig } from 'aft-core';
import { TestRailConfig } from "../../src/configuration/testrail-config";
import { TestRailOptions } from '../../src/configuration/testrail-options';

describe('TestRailConfig', () => {
    it('can get the url from aftconfig.json file', async () => {
        let expectedUrl: string = 'http://fake.testrail.ie';
        let config = await TestConfig.aftConfig();
        config['testrail'] = {"url": expectedUrl} as TestRailOptions;
        let url: string = await TestRailConfig.instance.getUrl();

        expect(url).toEqual(expectedUrl);
    });

    it('Max Log Characters defaults to 250', async () => {
        let max: number = await TestRailConfig.instance.getMaxLogCharacters();
        
        expect(max).toEqual(250);
    });

    it('write defaults to false', async () => {
        let write: boolean = await TestRailConfig.instance.getWrite();

        expect(write).toBe(false);
    });

    it('read defaults to false', async () => {
        let read: boolean = await TestRailConfig.instance.getRead();

        expect(read).toBe(false);
    });

    it('project_id defaults to -1', async () => {
        let projectId: number = await TestRailConfig.instance.getProjectId();

        expect(projectId).toBe(-1);
    });

    it('suite_ids defaults to empty array', async () => {
        let suiteIds: number[] = await TestRailConfig.instance.getSuiteIds();

        expect(suiteIds.length).toBe(0);
    });

    it('plan_id defaults to -1', async () => {
        let planId: number = await TestRailConfig.instance.getPlanId();

        expect(planId).toBe(-1);
    });
});