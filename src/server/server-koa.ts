import {Client} from '@elastic/elasticsearch';
import Koa = require('koa');
import koaStatic = require('koa-static');
import {initTemplate} from './init-template';
import {render404Page, renderPage} from './render-page';
// noinspection ES6PreferShortImport
import {ElasticSearchClient, SearchConfig} from '../config/types';
import {MdnSearchTemplate, SearchParams} from './types';
import {search} from './search';
import {StringBuffer} from '../utils';
import {search404Fallback} from './search-404-fallback';
import {searchForCaseRedirect} from './search-for-case-redirect';

export const koaSearchServer = (
  config: SearchConfig,
  client: ElasticSearchClient,
  template: MdnSearchTemplate
): Koa.Middleware => async (ctx, next) => {
  if (ctx.path !== '/search' &&
    // search ignore case
    ctx.path.toLowerCase() !== `/${config.locale.toLowerCase()}/search`) {
    if (ctx.path === '/static/build/styles/inject.css') {
      ctx.body = template.injectCss;
      ctx.set('Cache-Control', 'max-age=43200');
      ctx.type = 'css';
      return;
    }
    return await next();
  }
  if (ctx.path === '/search') {
    ctx.redirect(`/${config.locale}/search${ctx.search}`);
    return;
  }
  const params: SearchParams = {
    pageOffset: 0,
    page: 1,
    searchString: ctx.query.q || ''
  };
  let page: string | number = ctx.query.page || 1;
  if (typeof page === 'string') {
    page = Number(page) | 0;
    if (!page || page < 1) {
      page = 1;
    }
  }
  if (config.maxPageNumber && page > config.maxPageNumber) {
    ctx.redirect(`/${config.locale}/search?q=${
      params.searchString
    }&page=${config.maxPageNumber}`);
    return;
  }
  params.page = page;
  params.pageOffset = (page - 1) * config.pageSize || 0;
  ctx.type = 'html';
  const result = await search(client, config, params);
  const buffer = new StringBuffer();
  renderPage(buffer, config, template, params, result);
  ctx.body = buffer.toBuffer();
};

export const koaUserFriendly404Page = (
  config: SearchConfig,
  t: MdnSearchTemplate,
  client: Client
) : Koa.Middleware => async (ctx, next) => {
  await next();
  if (ctx.status === 404 && !ctx.body) {
    const sb = new StringBuffer();
    if (ctx.path.startsWith('/@api') ||
      ctx.path.startsWith('/files')) {
      render404Page(sb, config, t, ctx.path);
    } else {
      const searchResult = await search404Fallback(client, config, ctx.path);
      render404Page(sb, config, t, ctx.path, searchResult);
    }
    ctx.type = 'html';
    ctx.body = sb.toBuffer();
  }
};

export const koaCaseRedirect = (
  config: SearchConfig,
  t: MdnSearchTemplate,
  client: Client
): Koa.Middleware => async (ctx, next) => {
  await next();
  if (ctx.status === 404 && !ctx.body &&
    !(ctx.path.startsWith('/@api') ||
      ctx.path.startsWith('/files'))) {
    const searchResult = await searchForCaseRedirect(client, config, ctx.path);
    if (searchResult) {
      ctx.redirect('/' + searchResult);
    }
  }
};

export async function koaServer(config: SearchConfig): Promise<Koa> {
  const app = new Koa();
  const client = new Client(config.elasticsearch);
  const t = await initTemplate(config);

  app.use(koaSearchServer(config, client, t));

  app.use(koaStatic(config.rootDir, {
    maxAge: 43200000,
    index: 'index.html',
    defer: false,
    extensions: [
      '.html',
      '/index.html'
    ]
  }));

  if (config.enableUserFriendly404Page) {
    // handle 404 not found
    app.use(koaUserFriendly404Page(config, t, client));
  }

  if (config.redirectCaseMismatchStaticContent) {
    app.use(koaCaseRedirect(config, t, client));
  }

  app.listen(config.port, () =>
    console.log('server started on port', config.port));

  return app;
}

