import {promises} from 'fs';
import {join} from 'path';
import {isMainThread, workerData as config, parentPort} from 'worker_threads';
import {Client} from '@elastic/elasticsearch';
import cheerio = require('cheerio');
import {escapeHtml} from '../utils';
import {MdnIndexData} from './types';

const client = new Client(config.elasticsearch);

if (isMainThread) {
  throw new TypeError('worker running in main thread');
}

const queue: string[] = [];
let processing = false;

const processEntry = async () => {
  processing = true;
  let entry: string | void;
  while ((entry = queue.shift())) {
    try {
      const p = join(config.rootDir, entry);
      const fileData = await promises.readFile(p, {encoding: 'utf8'});
      const $ = cheerio.load(fileData);
      const title = $('title').text();
      let content = $('#content').text();
      const summary = $('.summary').text();
      const time = $('.last-modified time').attr('datetime');
      const breadcrumb = $('.breadcrumbs li').text();
      if (!content || !(content = content.trim())) {
        parentPort?.postMessage({
          entry,
          status: 'empty'
        });
        continue;
      }
      await client.index<Record<string, unknown>, MdnIndexData>({
        id: entry,
        index: config.esIndex,
        body: {
          title: escapeHtml(title)
            .replace(/\| ?MDN$/i, ''),
          time: time,
          breadcrumb: escapeHtml(breadcrumb)
            .replace(/\s{2,}/g, ' '),
          content: escapeHtml(content)
            .replace(/\s{2,}/g, ' '),
          summary: escapeHtml(summary)
            .replace(/\s{2,}/g, ' '),
          url: entry,
          url_keyword: entry.toLowerCase()
        }
      });
    } catch (e) {
      console.error(e && e.body);
      parentPort?.postMessage({
        entry,
        status: 'error',
        error: e
      });
      processing = false;
      return;
    }
    parentPort?.postMessage({
      entry,
      status: 'success',
    });
  }
  processing = false;
};

parentPort?.on('message', (entry: string) => {
  queue.push(entry);
  if (!processing) processEntry();
});
