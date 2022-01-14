/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

export default class DOM {
  static createTable(data, document) {
    const table = document.createElement('table');

    data.forEach((row, index) => {
      const tr = document.createElement('tr');

      row.forEach((cell) => {
        const t = document.createElement(index === 0 ? 'th' : 'td');
        if (typeof cell === 'string') {
          t.innerHTML = cell;
        } else if (Array.isArray(cell)) {
          cell.forEach((c) => {
            t.append(c);
          });
        } else {
          t.append(cell);
        }
        tr.appendChild(t);
      });
      table.appendChild(tr);
    });

    return table;
  }

  static replaceBackgroundByImg(tag, document) {
    const url = tag.style['background-image'];
    if (url) {
      const src = url.replace(/url\(/gm, '').replace(/'/gm, '').replace(/\)/gm, '');
      const img = document.createElement('img');
      img.src = src;
      tag.replaceWith(img);
      return img;
    }
    return tag;
  }
}
