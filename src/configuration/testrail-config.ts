import { TestRailOptions } from "./testrail-options";

import { OptionsManager, LoggingLevel } from 'aft-core';

export class TestRailConfig extends OptionsManager<TestRailOptions> {
    private _url: string;
    private _user: string;
    private _accessKey: string;
    private _logLevel: LoggingLevel;
    private _read: boolean;
    private _write: boolean;
    private _maxLogChars: number;
    private _projectId: number;
    private _suiteIds: number[];
    private _planId: number;
    
    getOptionsConfigurationKey(): string {
        return 'testrail';
    }

    async getUrl(): Promise<string> {
        if (!this._url) {
            this._url = await this.getOption('url');
        }
        return this._url;
    }

    async getUser(): Promise<string> {
        if (!this._user) {
            this._user = await this.getOption('user');
        }
        return this._user;
    }

    async getAccessKey(): Promise<string> {
        if (!this._accessKey) {
            this._accessKey = await this.getOption('access_key');
        }
        return this._accessKey;
    }

    async getLoggingLevel(): Promise<LoggingLevel> {
        if (this._logLevel === undefined) {
            let levelStr: string = await this.getOption('logging_level', 'error');
            this._logLevel = LoggingLevel.parse(levelStr);
        }
        return this._logLevel;
    }

    async getRead(): Promise<boolean> {
        if (this._read === undefined) {
            this._read = await this.getOption('read', false);
        }
        return this._read;
    }

    async getWrite(): Promise<boolean> {
        if (this._write === undefined) {
            this._write = await this.getOption('write', false);
        }
        return this._write;
    }

    async getMaxLogCharacters(): Promise<number> {
        if (this._maxLogChars === undefined) {
            this._maxLogChars = await this.getOption('max_log_characters', 250);
        }
        return this._maxLogChars;
    }

    async getProjectId(): Promise<number> {
        if (this._projectId === undefined) {
            this._projectId = await this.getOption('project_id', -1);
        }
        return this._projectId;
    }

    async getSuiteIds(): Promise<number[]> {
        if (this._suiteIds === undefined) {
            this._suiteIds = await this.getOption('suite_ids', []);
        }
        return this._suiteIds;
    }

    async getPlanId(): Promise<number> {
        if (this._planId === undefined) {
            this._planId = await this.getOption('plan_id', -1);
        }
        return this._planId;
    }

    async setPlanId(id: number): Promise<void> {
        this._planId = id;
    }
}

export module TestRailConfig {
    export var instance = new TestRailConfig();
}