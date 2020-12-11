import {join} from 'path';
import {isMainThread, Worker} from 'worker_threads';
import {cpus} from 'os';
// noinspection ES6PreferShortImport
import {ElasticSearchClient, SearchConfig} from '../config/types';
import {BuildIndexWorkerMessage} from './types';
import {stream as glob} from 'fast-glob';
import {configure, getLogger}  from 'log4js';
import {Client} from '@elastic/elasticsearch';

export const configureLogger = (
  dir: string
): ReturnType<typeof configure> => configure({
  appenders: {
    'file': {
      type: 'file',
      filename: join(dir, 'build-index.log')
    },
    'stderr': {
      type: 'stderr'
    }
  },
  categories: {
    'empty': {
      appenders: ['file'],
      level: 'debug'
    },
    'success': {
      appenders: ['file'],
      level: 'debug'
    },
    'error': {
      appenders: ['stderr', 'file'],
      level: 'debug'
    },
    'default': {
      appenders: ['stderr', 'file'],
      level: 'debug'
    }
  }
});

const logger = {
  empty: getLogger('empty'),
  success: getLogger('success'),
  error: getLogger('error'),
};

/**
 * @param {SearchConfig} config
 * @param {ElasticSearchClient} client
 * @return {Promise<void>}
 */
const configIndex = async (config: SearchConfig, client: ElasticSearchClient) => {
  const ret = await client.indices.exists({
    index: config.esIndex
  });
  if (!ret.body && (config.esIndexSetting || config.esIndexMapping)) {
    await client.indices.create({
      index: config.esIndex
    });
    await client.indices.close({
      index: config.esIndex
    });
    if (config.esIndexSetting) {
      await client.indices.putSettings({
        index: config.esIndex,
        body: config.esIndexSetting
      });
    }
    if (config.esIndexMapping) {
      await client.indices.putMapping({
        index: config.esIndex,
        body: config.esIndexMapping
      });
    }
    await client.indices.open({
      index: config.esIndex
    });
  }
};

export const buildIndex = async (config: SearchConfig): Promise<void> => {
  if (!isMainThread) {
    throw new TypeError('main script running in worker thread');
  }

  let entryCount = 0, completed = false, resolve: () => void;
  const workers: Worker[] = [];
  const end = () => {
    workers.forEach(w => w.terminate());
    if (resolve) {
      resolve();
    }
  };
  const initWorker = () => {
    let c = config.workersForBuildingIndex;
    if (!c) {
      c = cpus().length - 1;
    }
    let w;
    for (let i = 0; i < c; i++) {
      workers.push(w = new Worker(join(__dirname, 'build-index-worker.js'), {
        workerData: config
      }));
      w.on('message', (msg: BuildIndexWorkerMessage) => {
        if (msg.status === 'error') {
          logger.error.error(msg.entry, msg.error, msg.error.body);
        } else {
          logger[msg.status].info(msg.entry);
        }
        if (--entryCount <= 0 && completed) {
          logger.success.info('Probably finished');
          client.indices.flush({
            index: config.esIndex
          }).then(end);
        }
      });
    }
  };

  const buildIndex = async () => {
    const stream = glob(config.locale + '/docs/**/*.html', {
      cwd: config.rootDir,
      absolute: false
    });
    let currentWorker = 0;
    const maxWorkers = workers.length;
    for await (const entry of stream) {
      workers[currentWorker++].postMessage(entry);
      if (currentWorker >= maxWorkers) {
        currentWorker = 0;
      }
      ++entryCount;
    }
    completed = true;
  };
  const client = new Client(config.elasticsearch);

  configureLogger(config.logPath);
  initWorker();
  await configIndex(config, client);
  await buildIndex();
  return new Promise<void>(r => resolve = r);
};
