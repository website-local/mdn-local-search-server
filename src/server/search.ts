import {Client} from '@elastic/elasticsearch';
import {SearchParams, SearchResponse} from './types';
// noinspection ES6PreferShortImport
import {MdnIndexData} from '../build-index/types';
import {SearchBody} from 'elastic-ts';
// noinspection ES6PreferShortImport
import {SearchConfig} from '../config/types';

export const search = async (
  client: Client,
  config: SearchConfig,
  params: SearchParams
): Promise<SearchResponse<MdnIndexData>> => {
  const body: SearchBody = {
    _source: {
      excludes: ['content', 'summary', 'breadcrumb']
    },
    highlight: {
      fields: {
        content: {},
        summary: {}
      }
    },
    query: {
      simple_query_string: {
        query: params.searchString,
        fields: ['title^5', 'breadcrumb', 'summary', 'content'],
      }
    }
  };

  const ts = Date.now();
  try {
    const result = await client.search<SearchResponse<MdnIndexData>>({
      index: config.esIndex,
      size: config.pageSize,
      from: params.pageOffset,
      body
    }, {
      ignore: [404],
      maxRetries: 3,
      requestTimeout: config.requestTimeout
    });

    return result.body;
  } catch (e) {
    return {
      _scroll_id: '-1',
      aggregations: undefined,
      hits: {
        max_score: 0,
        hits: []
      },
      timed_out: false,
      took: Date.now() - ts
    };
  }
};
