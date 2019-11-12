import { TestRailConfig } from "../configuration/testrail-config";
import { HttpRequest, HttpService, HttpResponse, HttpMethod, ContentType } from "aft-web-services";
import { Convert, Wait } from "aft-core";
import { TestRailCase } from "./testrail-case";
import { TestRailErrorResponse } from "./testrail-error-response";
import { TestRailCache } from "./testrail-cache";
import { TestRailTest } from "./testrail-test";
import { TestRailRun } from "./testrail-run";
import { TestRailResultRequest } from "./testrail-result-request";
import { TestRailResultResponse } from "./testrail-result-response";
import { TestRailPlan } from "./testrail-plan";

export class TestRailApi {
    async addResult(caseId: string, result: TestRailResultRequest, planId: number): Promise<TestRailResultResponse[]> {
        let test: TestRailTest = await this.getTestByCaseId(caseId, planId);
        let path: string = 'add_result/' + test.id;

        let results: TestRailResultResponse[] = await this.post<TestRailResultResponse[]>(path, JSON.stringify(result));

        return results;
    }

    async getTestByCaseId(caseId: string, planId: number): Promise<TestRailTest> {
        let runs: TestRailRun[] = await this.getRunsInPlan(planId);
        let runIds: number[] = [];
        for (var i=0; i<runs.length; i++) {
            runIds.push(runs[i].id);
        }
        let tests: TestRailTest[] = await this.getTestsInRuns(runIds);
        for (var i=0; i<tests.length; i++) {
            if ('C' + tests[i].case_id == caseId) {
                return tests[i];
            }
        }
        return Promise.reject("no TestRailTest could be found for CaseId '" + caseId + "' in TestRailPlan: '" + planId + "'.");
    }

    async getCasesInSuites(projectId: number, suiteIds: number[]): Promise<TestRailCase[]> {
        let allCases: TestRailCase[] = [];
        let path: string = 'get_cases/' + projectId + '&suite_id=';
        for (var i=0; i<suiteIds.length; i++) {
            let cases: TestRailCase[] = await this.get<TestRailCase[]>(path + suiteIds[i], true);
            if (cases) {
                for (var j=0; j<cases.length; j++) {
                    allCases.push(cases[j]);
                }
            }
        }

        return allCases;
    }

    async getTestsInRuns(runIds: number[]): Promise<TestRailTest[]> {
        let allTests: TestRailTest[] = [];
        let path: string = 'get_tests/';

        for (var i=0; i<runIds.length; i++) {
            let tests: TestRailTest[] = await this.get<TestRailTest[]>(path + runIds[i], true);
            if (tests) {
                for (var j=0; j<tests.length; j++) {
                    allTests.push(tests[j]);
                }
            }
        }

        return allTests;
    }

    async getRunsInPlan(planId: number): Promise<TestRailRun[]> {
        let plan: TestRailPlan = await this.getPlan(planId);
        let runs: TestRailRun[] = [];
        if (plan && plan.entries) {
            for (var i=0; i<plan.entries.length; i++) {
                for (var j=0; j<plan.entries[i].runs.length; j++) {
                    runs.push(plan.entries[i].runs[j]);
                }
            }
        }
        return runs;
    }

    async getPlan(planId: number) : Promise<TestRailPlan> {
        let path: string = 'get_plan/' + planId;
        let plan: TestRailPlan = await this.get<TestRailPlan>(path, true);
        return plan;
    }

    async get<T>(path: string, cache: boolean): Promise<T> {
        let request: HttpRequest = new HttpRequest();
        request.method = HttpMethod.GET;
        let fullUrl: string = await this.fullUrl();
        request.url = fullUrl + path;
        let response: HttpResponse;
        
        if (TestRailCache.has(request.url)) {
            response = new HttpResponse();
            response.data = TestRailCache.get(request.url);
        } else {
            response = await this.performRequestWithRateLimitHandling(request);

            if (cache && response.statusCode >= 200 && response.statusCode <= 299) {
                TestRailCache.set(request.url, response.data);
            }
        }

        return response.dataAs<T>();
    }

    async post<T>(path: string, data: string): Promise<T> {
        let request: HttpRequest = new HttpRequest();
        request.method = HttpMethod.POST;
        let fullUrl: string = await this.fullUrl();
        request.url = fullUrl + path;
        request.postData = data;

        let response: HttpResponse = await this.performRequestWithRateLimitHandling(request);

        return response.dataAs<T>();
    }

    private async fullUrl(): Promise<string> {
        return await TestRailConfig.url() + 'index.php?/api/v2/';
    }

    private async performRequestWithRateLimitHandling(request: HttpRequest): Promise<HttpResponse> {
        request.headers['Authorization'] = 'Basic ' + await this.getAuth();
        request.headers['Content-Type'] = ContentType.application_json;
        let retry: boolean;
        let response: HttpResponse;

        do { // allow retries on API Rate Limit Exceeded
            retry = false;
            response = await HttpService.instance.performRequest(request);
            let err: TestRailErrorResponse;
            try {
                err = response.dataAs<TestRailErrorResponse>();
            } catch (e) {
                /* ignore */
            }
            if (err && err.error) {
                if (err.error.includes('API Rate Limit Exceeded')) {
                    retry = true;
                    await Wait.forDuration(60000); // one minute
                } else {
                    return Promise.reject(err.error);
                }
            }
        } while (retry);

        return response;
    }

    private async getAuth(): Promise<string> {
        let user: string = await TestRailConfig.user();
        let pass: string = await TestRailConfig.password();
        return Convert.toBase64Encoded(user + ':' + pass);
    }
}