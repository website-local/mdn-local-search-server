import {isAbsolute, resolve} from 'path';
import {cpus} from 'os';
import {alias} from 'yargs';
import {SearchConfig} from './types';

const defaultConfig: Partial<SearchConfig> = {
  port: 3000,
  logPath: process.cwd(),
  maxSearchStringLength: 63,
  pageSize: 10,
  workersForBuildingIndex: 3,
  text: {
    beforeTitle: '搜索结果：“',
    afterTitle: '” | MDN',
    results: '搜索结果：',
    search: '搜索 MDN',
    previousPage: '上一页',
    nextPage: '下一页',
    openSearch: '打开搜索',
    closeSearch: '关闭搜索',
    noResult: '未找到匹配的文档。',
    meta: [
      '在 ',
      ' 版本中找到 ',
      ' 篇关于“',
      '”的文档。',
      '已显示结果 ',
      ' 至 ',
      '。'
    ],
  },
  notFoundHtml: '<main id="content" role="main">' +
    '<div class="center clear">' +
    '<section id="content">' +
    '  <div class="wrap">' +
    '  <section id="content-main" class="full" role="main">' +
    '    <h1>找不到页面</h1>' +
    '    <p>很抱歉，我们找不到您要找的东西。</p>' +
    '  </section>' +
    '</div>' +
    '</section>' +
    '</div>' +
    '</main>',
  esIndexSetting: {
    max_ngram_diff: 18,
    analysis: {
      filter: {
        kuma_word_delimiter: {
          type: 'word_delimiter',
          preserve_original: true,  // hi-fi -> hifi, hi-fi
          catenate_words: true,  // hi-fi -> hifi
          catenate_numbers: true,  // 90-210 -> 90210
        }
      },
      analyzer: {
        'default': {'tokenizer': 'standard', 'filter': ['elision']},
        kuma_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: [
            'elision',
            'kuma_word_delimiter',
            'lowercase',
            'stop',
            'snowball',
          ]
        },
        ngram_analyzer: {
          type: 'custom',
          tokenizer: 'ngram_tokenizer',
          filter: [
            'elision',
            'lowercase',
            'stop',
            'snowball',
          ]
        }
      },
      tokenizer: {
        ngram_tokenizer: {
          type: 'ngram',
          min_gram: 2,
          max_gram: 16,
          token_chars: [
            'letter',
            'digit'
          ]
        }
      }
    }
  },
  esIndexMapping: {
    properties: {
      title: {
        type: 'text',
        analyzer: 'ngram_analyzer',
        search_analyzer: 'kuma_analyzer'
      },
      summary: {
        type: 'text',
        analyzer: 'ngram_analyzer',
        search_analyzer: 'kuma_analyzer'
      },
      breadcrumb: {
        type: 'text',
        analyzer: 'ngram_analyzer',
        search_analyzer: 'kuma_analyzer'
      },
      content: {
        type: 'text',
        analyzer: 'kuma_analyzer',
        search_analyzer: 'kuma_analyzer'
      }
    }
  }
};

const required = (config: Partial<SearchConfig>, field: keyof SearchConfig) => {
  if (!config[field]) {
    throw new TypeError(field + ' is required');
  }
};

export const resolveConfig = (config: Partial<SearchConfig>): SearchConfig => {
  if (!config) throw new TypeError('config is required');
  required(config, 'rootDir');
  required(config, 'esIndex');
  required(config, 'elasticsearch');
  required(config, 'locale');
  if (!config.workersForBuildingIndex || config.workersForBuildingIndex < 0) {
    config.workersForBuildingIndex = Math.max(1, cpus().length >> 1);
  }
  return Object.assign({}, defaultConfig, config) as SearchConfig;
};


export const resolveArgv = (): SearchConfig => {
  const {argv} = alias('c', 'config')
    .demand('config', true);
  let config: string | string[] = argv.config as string | string[];
  if (Array.isArray(config)) {
    // probably try every possibly config
    config = config[0];
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return resolveConfig(require(isAbsolute(config as string) ?
    config : resolve(process.cwd(), config)));
};
