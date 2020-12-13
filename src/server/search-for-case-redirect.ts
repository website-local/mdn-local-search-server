import {Client} from '@elastic/elasticsearch';
import {SearchResponse} from './types';
// noinspection ES6PreferShortImport
import {MdnIndexData} from '../build-index/types';
import {SearchBody} from 'elastic-ts';
// noinspection ES6PreferShortImport
import {SearchConfig} from '../config/types';

export const searchForCaseRedirect = async (
  client: Client,
  config: SearchConfig,
  path: string
): Promise<string | void> => {
  const query = path[0] === '/' ? path.slice(1) : path;
  const body: SearchBody = {
    _source: false,
    query: {
      term: {
        url_keyword: {
          value: query.toLowerCase()
        }
      }
    }
  };

  try {
    const result = await client.search<SearchResponse<MdnIndexData>>({
      index: config.esIndex,
      size: 1,
      body
    }, {
      ignore: [404],
      maxRetries: 1,
      requestTimeout: config.redirectCaseMismatchSearchTimeout ||
        config.notFoundSearchTimeout || config.searchTimeout
    });

    return result.body?.hits?.hits?.[0]?._id;
  } catch (e) {
    return;
  }
};
