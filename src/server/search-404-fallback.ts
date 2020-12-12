import {Client} from '@elastic/elasticsearch';
import {SearchResponse} from './types';
// noinspection ES6PreferShortImport
import {MdnIndexData} from '../build-index/types';
import {SearchBody} from 'elastic-ts';
// noinspection ES6PreferShortImport
import {SearchConfig} from '../config/types';

export const search404Fallback = async (
  client: Client,
  config: SearchConfig,
  path: string
): Promise<SearchResponse<MdnIndexData>> => {
  const query = path[0] === '/' ? path.slice(1) : path;
  const body: SearchBody = {
    _source: {
      excludes: ['content', 'summary', 'breadcrumb', 'time', 'url', 'url_keyword']
    },
    query: {
      match: {
        url: {
          query
        }
      }
    }
  };

  const ts = Date.now();
  try {
    const result = await client.search<SearchResponse<MdnIndexData>>({
      index: config.esIndex,
      size: config.pageSize,
      body
    }, {
      ignore: [404],
      maxRetries: 1,
      requestTimeout: config.notFoundSearchTimeout || config.searchTimeout
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
