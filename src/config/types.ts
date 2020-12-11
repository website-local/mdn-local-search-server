import {Client, ClientOptions} from '@elastic/elasticsearch';

export type ElasticSearchClient = Client;
// search: move out to standalone repo
export interface SearchConfig {
  port: number;
  rootDir: string;
  logPath: string;
  templatePage?: string;
  injectCssFile?: string;
  searchCssPath?: string;
  searchScriptPath?: string;
  locale: string;
  esIndex: string;
  elasticsearch: ClientOptions;
  maxSearchStringLength: number;
  pageSize: number;
  workersForBuildingIndex?: number;
  requestTimeout?: number;
  text: {
    beforeTitle: string;
    afterTitle: string;
    results: string;
    search: string;
    previousPage: string;
    nextPage: string;
    openSearch: string;
    closeSearch: string;
    noResult: string;
    meta: string[];
  };
  notFoundHtml: string;

  esIndexSetting?: Record<string, unknown>;
  esIndexMapping?: Record<string, unknown>;
}
