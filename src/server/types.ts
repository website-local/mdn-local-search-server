export interface MdnSearchTemplate {
  styleSheetUrls: string[];
  icon?: string;
  header: string | null;
  searchStyle: string;
  injectCss: string;
  searchScript: string;
  headHtmlBeforeTitle: string;
  headHtmlAfterTitle: string;
  bodyHtmlBeforeTitle: string;
  bodyHtmlAfterTitle: string;
  bodyHtmlEnding: string;
  noContentHtml: string;
}

export interface SearchParams {
  searchString: string;
  page: number;
  pageOffset: number;
}

// Complete definition of the Search response
export interface ShardsResponse {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

export interface Explanation {
  value: number;
  description: string;
  details: Explanation[];
}

export interface SearchResponse<T> {
  took: number;
  timed_out: boolean;
  _scroll_id?: string;
  _shards?: ShardsResponse;
  hits: {
    total?: {
      value: number,
      relation: string
    };
    max_score: number;
    hits: Array<{
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: T;
      _version?: number;
      _explanation?: Explanation;
      fields?: unknown;
      highlight?: {
        [K in keyof T]?: T[K][]
      };
      inner_hits?: unknown;
      matched_queries?: string[];
      sort?: string[];
    }>;
  };
  aggregations?: unknown;
}

