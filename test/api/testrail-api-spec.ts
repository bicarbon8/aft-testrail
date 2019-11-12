import { TestRailApi } from "../../src/api/testrail-api";
import { HttpRequest, HttpService, HttpResponse } from "aft-web-services";
import { TestRailResultRequest } from "../../src/api/testrail-result-request";
import { TestRailTest } from "../../src/api/testrail-test";
import { TestRailCache } from "../../src/api/testrail-cache";

describe('TestRailApi', () => {
    afterEach(() => {
        TestRailCache.clear();
    });

    /**
     * NOTE: long running test (takes over 1 minute).
     * Only run when making changes to retry behaviour
     */
    xit('retries on Rate Limit Error response (long running)', async () => {
        spyOn(HttpService.instance, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            let response: HttpResponse = new HttpResponse();
            if (TestStore.count < 1) {
                response.statusCode = 429;
                response.data = '{"error":"API Rate Limit Exceeded"}';
            } else {
                response.statusCode = 200;
                response.data = '{}';
            }
            TestStore.count++;

            return response;
        });

        let api: TestRailApi = new TestRailApi();
        let result: TestRailResultRequest = new TestRailResultRequest();

        try {
            await api.addResult('C1234', result, 1234);
        } catch (e) {
            /* ignore */
        }

        expect(TestStore.count).toBeGreaterThan(0);
    });

    it('can cache successful responses', async () => {
        let httpSpy = spyOn(HttpService.instance, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            let response: HttpResponse = new HttpResponse();
            response.statusCode = 200;
            let test = new TestRailTest();
            test.id = 2;
            test.case_id = 3;
            test.priority_id = 5;
            test.title = 'sample test';
            response.data = JSON.stringify(test);
            return response;
        });

        let api: TestRailApi = new TestRailApi();
        let test: TestRailTest = await api.get<TestRailTest>('fake/path', true);

        expect(test).not.toBeNull();
        expect(test.id).toEqual(2);
        expect(httpSpy).toHaveBeenCalledTimes(1);

        let cachedResponse: TestRailTest = await api.get<TestRailTest>('fake/path', true);

        expect(cachedResponse).not.toBeNull();
        expect(cachedResponse.id).toEqual(2);
        expect(httpSpy).toHaveBeenCalledTimes(1); // no additional call made
    });

    it('will not cache non 200-299 status code responses', async () => {
        let httpSpy = spyOn(HttpService.instance, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            let response: HttpResponse = new HttpResponse();
            response.statusCode = 404;
            response.data = '{}';
            return response;
        });

        let api: TestRailApi = new TestRailApi();
        let test: any = await api.get<any>('fake/path', true);

        expect(test).not.toBeNull();
        expect(httpSpy).toHaveBeenCalledTimes(1);

        let nonCachedResponse: any = await api.get<any>('fake/path', true);

        expect(nonCachedResponse).not.toBeNull();
        expect(httpSpy).toHaveBeenCalledTimes(2); // failure on request so nothing cached
    });

    it('can not cache successful responses', async () => {
        let httpSpy = spyOn(HttpService.instance, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            let response: HttpResponse = new HttpResponse();
            response.statusCode = 200;
            let test = new TestRailTest();
            test.id = 2;
            test.case_id = 3;
            test.priority_id = 5;
            test.title = 'sample test';
            response.data = JSON.stringify(test);
            return response;
        });

        let api: TestRailApi = new TestRailApi();
        let test: TestRailTest = await api.get<TestRailTest>('fake/path', false);

        expect(test).not.toBeNull();
        expect(test.id).toEqual(2);
        expect(httpSpy).toHaveBeenCalledTimes(1);

        let cachedResponse: TestRailTest = await api.get<TestRailTest>('fake/path', false);

        expect(cachedResponse).not.toBeNull();
        expect(cachedResponse.id).toEqual(2);
        expect(httpSpy).toHaveBeenCalledTimes(2); // no additional call made
    });
});

module TestStore {
    export var count: number = 0;
}