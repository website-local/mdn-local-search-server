import {
  MdnSearchTemplate,
  SearchParams,
  SearchResponse,
} from './types';
// noinspection ES6PreferShortImport
import {SearchConfig} from '../config/types';
// noinspection ES6PreferShortImport
import {MdnIndexData} from '../build-index/types';
import {escapeHtml, Writable} from '../utils';

export const renderHeader = (
  target: Writable,
  templateData: MdnSearchTemplate,
  params: SearchParams
): void => {
  target.push(templateData.headHtmlBeforeTitle);
  params.searchString = escapeHtml(params.searchString);
  target.push(params.searchString);
  target.push(templateData.headHtmlAfterTitle);
};

export const renderBody = (
  target: Writable,
  templateData: MdnSearchTemplate,
  params: SearchParams
): void => {
  target.push(templateData.bodyHtmlBeforeTitle);
  if (templateData.header) {
    target.push(params.searchString);
  }
  target.push(templateData.bodyHtmlAfterTitle);
  if (templateData.header) {
    target.push(params.searchString);
    target.push('</h1></div></div>');
  }
};

export const renderSearch = (
  target: Writable,
  config: SearchConfig,
  templateData: MdnSearchTemplate,
  params: SearchParams,
  result?: SearchResponse<MdnIndexData>
): void => {
  target.push('<div class="search-results">' +
    '<div class="result-container">' +
    '<p class="result-meta">');
  if (config.text.meta[0]) {
    target.push(config.text.meta[0]);
  }
  target.push(config.locale);
  if (config.text.meta[1]) {
    target.push(config.text.meta[1]);
  }
  const hits: SearchResponse<MdnIndexData>['hits'] | void = result?.hits;
  const count: SearchResponse<MdnIndexData>['hits']['total'] | void =
    hits ? hits.total : undefined;
  target.push(count ? String(count.value) : '0');
  if (config.text.meta[2]) {
    target.push(config.text.meta[2]);
  }
  target.push(params.searchString);
  if (config.text.meta[3]) {
    target.push(config.text.meta[3]);
  }

  if (!hits || !count || !count.value) {
    target.push(config.text.noResult);
    target.push('</p></div>');
    target.push(templateData.noContentHtml);
    target.push('</div>');
    return;
  }
  const endCount = params.pageOffset + hits.hits.length;
  if (params.pageOffset >= endCount) {
    params.pageOffset = endCount - 1;
  }
  if (config.text.meta[4]) {
    target.push(config.text.meta[4]);
  }
  target.push(String(params.pageOffset + 1));
  if (config.text.meta[5]) {
    target.push(config.text.meta[5]);
  }
  target.push(String(endCount));
  if (config.text.meta[6]) {
    target.push(config.text.meta[6]);
  }
  target.push('</div>');
  const stream = target;
  for (let i = 0, item; i < hits.hits.length; i++) {
    item = hits.hits[i];
    target.push(`<div class="result-container"><div class="result">\
<div><a class="result-title" href="../${item._id}">${item._source.title}</a></div>\
<div class="result-excerpt">`);
    if (item.highlight) {
      if (item.highlight.content && item.highlight.content.length) {
        for (let j = 0, c = item.highlight.content, l = c.length, s; j < l; j++) {
          s = c[j];
          if (s) {
            target.push(s);
            if (i > l - 1) {
              target.push('<br/>');
            }
          }
        }
      } else if (item.highlight.summary && item.highlight.summary.length) {
        for (let j = 0, c = item.highlight.summary, l = c.length; j < l; j++) {
          target.push(c[j]);
          if (i > l - 1) {
            target.push('<br/>');
          }
        }
      }
    }
    target.push(`</div>\
<div class="result-url"><a href="../${item._id}">${item._id}</a></div></div></div>`);
  }
  stream.push('<div class="result-container results-more">' + '<div>');
  if (params.page > 1) {
    stream.push(`<a class="button" href="?page=${params.page - 1}&amp;q=${
      params.searchString
    }" id="search-result-previous">${config.text.previousPage}</a>`);
  }
  if (count.value > endCount) {
    stream.push(` <a class="button" href="?page=${params.page + 1}&amp;q=${
      params.searchString
    }" id="search-result-next">${config.text.nextPage}</a>`);
  }
  stream.push('</div></div></div>');
};

export const renderEnding = (
  target: Writable,
  templateData: MdnSearchTemplate
): void => {
  target.push(templateData.bodyHtmlEnding);
};

export const renderPage = (
  target: Writable,
  config: SearchConfig,
  templateData: MdnSearchTemplate,
  params: SearchParams,
  result?: SearchResponse<MdnIndexData>
): void => {
  renderHeader(target, templateData, params);
  renderBody(target, templateData, params);
  renderSearch(target, config, templateData, params, result);
  renderEnding(target, templateData);
};
