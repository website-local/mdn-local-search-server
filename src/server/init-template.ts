import {join, resolve} from 'path';
import {promises as fs} from 'fs';
import cheerio = require('cheerio');
// noinspection ES6PreferShortImport
import {SearchConfig} from '../config/types';
import {MdnSearchTemplate} from './types';

export const initTemplate = async (config: SearchConfig): Promise<MdnSearchTemplate> => {
  const templatePath = config.templatePage ?
    join(config.rootDir, config.templatePage) :
    join(config.rootDir, config.locale, 'index.html');

  const injectCssPath = config.injectCssFile ?
    join(config.rootDir, config.injectCssFile) :
    join(config.rootDir, 'static', 'build', 'styles', 'inject.css');
  const searchCssPath = config.searchCssPath ||
    resolve(__dirname, '..', 'static', 'search.min.css');
  const searchScriptPath = config.searchScriptPath ||
    resolve(__dirname, '..', 'static', 'search.js');

  const promises = [injectCssPath, searchCssPath, searchScriptPath, templatePath]
    .map(p => fs.readFile(p, {encoding: 'utf8'}));

  const template = await promises[3];
  const $ = cheerio.load(template);
  const styleSheets = $('link[rel="stylesheet"]');
  const styleSheetUrls: string[] = [];
  styleSheets.each((i, e) => {
    const url = $(e).attr('href');
    if (url && (
      url.includes('react-header') ||
      url.includes('react-mdn') ||
      url.includes('print'))) {
      styleSheetUrls.push(url);
    }
  });

  const icon = $('link[rel="shortcut icon"]').attr('href');
  $('.page-header a.logo').attr('href', 'index.html');
  const header = $('.page-header').html();

  const [injectCss, searchStyle, searchScript] = await Promise.all(promises);
  const processedInjectCss = injectCss &&
    injectCss.replace('#nav-main-search,', '');

  // region pre render html template
  const headHtmlBeforeTitle =
    `<!DOCTYPE html><html lang="${config.locale}" dir="ltr" class="no-js">\
<head prefix="og: http://ogp.me/ns#">\
<meta charset="utf-8">\
<meta http-equiv="X-UA-Compatible" content="IE=Edge">\
<title>`;

  // region headHtmlAfterTitle
  let headHtmlAfterTitle = '</title>\
<meta name="viewport" content="width=device-width, initial-scale=1">\
<meta name="robots" content="noindex, nofollow">';

  for (let i = 0, a = styleSheetUrls, l = a.length; i < l; i++) {
    // we trust templateData, no escape here
    headHtmlAfterTitle += `<link href="${a[i]}" rel="stylesheet" type="text/css">`;
  }
  if (icon) {
    headHtmlAfterTitle += `<link href="${icon}" rel="shortcut icon">`;
  }
  headHtmlAfterTitle += `<style>${searchStyle}</style></head>`;
  // endregion headHtmlAfterTitle

  let bodyHtmlBeforeTitle = '<body class="no-js">';
  if (header) {
    bodyHtmlBeforeTitle += `<div id="react-container"><header class="page-header">\
${header}\
<div class="header-search">\
<form id="nav-main-search" action="" method="get" role="search">\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 28" \
aria-hidden="true" class="search-icon">
<path d="M18 13c0-3.859-3.141-7-7-7s-7 3.141-7 7 3.141 7 7 7 7-3.141 \
7-7zm8 13c0 1.094-.906 2-2 2a1.96 1.96 0 0 1-1.406-.594l-5.359-5.344a10.971 \
10.971 0 0 1-6.234 1.937c-6.078 0-11-4.922-11-11s4.922-11 11-11 11 4.922 \
11 11c0 2.219-.672 4.406-1.937 6.234l5.359 5.359c.359.359.578.875.578 1.406z">\
</path></svg>\
<label for="main-q" class="visually-hidden">${config.text.search}</label>\
<input class="search-input-field" type="search" \
id="main-q" name="q" value="`;
  }

  let bodyHtmlAfterTitle = '';
  if (header) {
    bodyHtmlAfterTitle = `" placeholder="${config.text.search}" \
minlength="2" pattern="(.|\\s)*\\S(.|\\s)*" required>\
</form>\
<button class="toggle-form">\
<svg xmlns="http://www.w3.org/2000/svg" role="presentation" \
viewBox="0 0 24 24" class="close-icon">\
<path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 \
7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 \
101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" fill-rule="nonzero"></path></svg>\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" \
class="search-icon"><path fill-rule="nonzero" \
d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 001.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 \
6.505 0 00-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 005.34-1.48l.27.28v.79l4.25 \
4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 \
9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>\
<span>${config.text.openSearch}</span></button>\
</div>\
</header></div>\
<div class="titlebar-container"><div class="titlebar">\
<h1 class="title">${config.text.results}`;
  }

  // endregion pre render html template

  return {
    styleSheetUrls,
    icon,
    header,
    searchStyle,
    searchScript,
    injectCss: processedInjectCss,
    headHtmlBeforeTitle,
    headHtmlAfterTitle,
    bodyHtmlBeforeTitle,
    bodyHtmlAfterTitle,
    bodyHtmlEnding: `<script>${searchScript}</script></body></html>`,
    noContentHtml: `<div class="result-container"><div class="no-results">${
      config.text.noResult
    }</div></div>`
  };
};
