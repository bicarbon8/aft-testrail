import { TestRailRun } from "./testrail-run";

export class TestRailPlanEntry {
    id: string;
    name: string;
    runs: TestRailRun[];
    suite_id: number;
}