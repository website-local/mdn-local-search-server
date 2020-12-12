import {Client, ClientOptions} from '@elastic/elasticsearch';
import {userFriendly404Page} from '..';

export type ElasticSearchClient = Client;

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
  maxPageNumber?: number;
  workersForBuildingIndex?: number;
  searchTimeout?: number;
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
    notFound: string;
    notFoundFallback: string;
  };
  enableUserFriendly404Page?: boolean;
  notFoundHtml: string;
  notFoundSearchTimeout?: number;

  esIndexSetting?: Record<string, unknown>;
  esIndexMapping?: Record<string, unknown>;
}
