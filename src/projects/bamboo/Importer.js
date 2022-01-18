/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-console, class-methods-use-this */

import { PageImporter, PageImporterResource, DOMUtils } from '@adobe/helix-importer';

import fetch from 'node-fetch';
import path from 'path';

import Blocks from '../../utils/Blocks.js';
import DOM from '../../utils/DOM.js';

export default class Importer extends PageImporter {
  async fetch(url) {
    return fetch(url);
  }

  cleanupName(name) {
    let n = name;
    const firstChar = n.charAt(0);
    const lastChar = n.charAt(n.length - 1);
    if (!/[A-Za-z0-9]/.test(firstChar)) {
      n = n.substring(1);
    }
    if (!/[A-Za-z0-9]/.test(lastChar)) {
      n = n.slice(0, -1);
    }
    return n;
  }

  createMetadata(main, document) {
    const meta = {};

    const title = document.querySelector('title');
    if (title) {
      meta.Title = title.innerHTML.replace(/[\n\t]/gm, '');
    }

    const desc = document.querySelector('[property="og:description"]');
    if (desc) {
      meta.Description = desc.content;
    }

    const category = document.querySelector('[property="article:section"]');
    if (category) {
      meta.Category = category.content;
    }

    const date = document.querySelector('[property="article:published_time"]');
    if (date) {
      meta['Publication Date'] = date.content.substring(0, date.content.indexOf('T'));
    }

    const author = main.querySelector('[rel="author"]');
    if (author) {
      meta.Author = author;
    }

    const metatop = main.querySelector('.blogPostContent__metaTop');
    if (metatop) {
      const split = metatop.textContent.trim().split('\n');
      if (split.length === 3) {
        // eslint-disable-next-line prefer-destructuring
        meta['Read Time'] = split[2].trim();
      }
    }

    const img = document.querySelector('[property="og:image"]');
    if (img) {
      const el = document.createElement('img');
      el.src = img.content;
      meta.Image = el;
    }

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    return meta;
  }

  createEmbeds(main, document) {
    main.querySelectorAll('iframe').forEach((embed) => {
      let src = embed.getAttribute('src');
      src = src && src.startsWith('//') ? `https:${src}` : src;
      if (src) {
        embed.replaceWith(DOM.createTable([
          ['Embed'],
          [`<a href="${src}">${src}</a>`],
        ], document));
      }
    });
  }

  createCallouts(main, document) {
    main.querySelectorAll('.blogPostContent__ctaContainer').forEach((callout) => {
      const rows = [];
      let blockName = 'Callout';

      if (callout.classList.contains('blogPostContent__ctaContainer--right')) {
        blockName += ' (right)';
      } else if (callout.classList.contains('blogPostContent__ctaContainer--left')) {
        blockName += ' (left)';
      }

      rows.push([blockName]);

      const container = document.createElement('div');

      const firstText = callout.querySelector('.blogPostContent__ctaText');
      if (firstText) {
        const h = document.createElement('h3');
        h.innerHTML = firstText.textContent;
        container.append(h);
      }

      const sub = callout.querySelector('.blogPostContent__ctaSubheading');
      if (sub) {
        const p = document.createElement('p');
        p.innerHTML = sub.innerHTML;
        container.append(p);
      }

      rows.push([container]);

      const cta = callout.querySelector('a');
      if (cta) {
        rows.push([cta]);
      }
      callout.replaceWith(DOM.createTable(rows, document));
    });
  }

  createRelatedPostsBlock(main, document) {
    const related = document.querySelectorAll('.blogPostsBlock__titleLink');
    if (related) {
      const cells = [];
      cells.push(['Related Posts']);
      related.forEach((r) => {
        // eslint-disable-next-line no-param-reassign
        r.innerHTML = r.getAttribute('href');
        cells.push([r]);
      });
      const table = DOM.createTable(cells, document);
      main.append(table);
    }
  }

  cleanupHeadings(main) {
    main.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      // eslint-disable-next-line no-param-reassign
      h.innerHTML = h.textContent;
    });
  }

  postProcessMD(md) {
    let ret = super.postProcessMD(md);
    ret = ret.replace(/\u00A0/gm, '');
    return ret;
  }

  async process(document, url) {
    DOMUtils.remove(document, [
      'header',
      'NavbarMobile',
      '.blogSearchIcon__container',
      'script',
      'noscript',
      '.Footer',
      '.blogSearch__overlay',
      '.blogPostBanner__extra',
      '.blogSocial',
      '.blogPostContentToc',
      '.blogPostContentSubscribe',
      '.blogPostAuthor',
    ]);

    const main = document.querySelector('.blogPostMain');

    this.cleanupHeadings(main, document);

    const title = document.querySelector('h1');

    let hero = document.querySelector('.blogPostBanner__img');
    if (hero) {
      hero = DOM.replaceBackgroundByImg(hero, document);
      if (title) hero.before(title);
    }

    this.createRelatedPostsBlock(main, document);
    this.createEmbeds(main, document);
    this.createCallouts(main, document);

    const meta = this.createMetadata(main, document);

    DOMUtils.remove(document, [
      '.blogPostContent__meta',
      '.blogPostContent__metaTop',
    ]);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    // eslint-disable-next-line no-shadow
    const subPath = `blog${s.filter((p, i) => i > 2).join('/')}`;

    const pir = new PageImporterResource(name, subPath, main, null, {
      meta,
    });

    return [pir];
  }
}
