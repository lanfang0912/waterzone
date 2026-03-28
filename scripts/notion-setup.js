#!/usr/bin/env node
/**
 * notion-setup.js
 * 在本機跑一次，自動建立 Notion database 並印出 Database ID。
 *
 * 使用方法：
 *   NOTION_TOKEN=ntn_xxx node scripts/notion-setup.js
 */

const https = require('https');

const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) {
  console.error('請設定環境變數 NOTION_TOKEN');
  console.error('用法：NOTION_TOKEN=ntn_xxx node scripts/notion-setup.js');
  process.exit(1);
}

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.notion.com',
      path,
      method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('建立 Notion database...');

  const db = await request('/v1/databases', 'POST', {
    parent: { type: 'workspace', workspace: true },
    title: [{ type: 'text', text: { content: 'Landing Pages' } }],
    icon: { type: 'emoji', emoji: '📄' },
    properties: {
      'Name':        { title: {} },
      'Slug':        { rich_text: {} },
      'URL':         { url: {} },
      'Kit Form ID': { rich_text: {} },
      '建立日期':     { date: {} },
      '按鈕文字':     { rich_text: {} },
      '確認信按鈕':   { rich_text: {} },
      'Email 主旨':   { rich_text: {} },
      '私訊關鍵字':   { rich_text: {} },
    }
  });

  if (db.object === 'error') {
    console.error('建立失敗:', db.message);
    process.exit(1);
  }

  const dbId = db.id;
  console.log('\n✅ Database 建立成功！\n');
  console.log('Database ID：', dbId);
  console.log('\n下一步：把以下兩個 secrets 加到 GitHub repo');
  console.log('  Settings → Secrets and variables → Actions → New repository secret\n');
  console.log('  NOTION_TOKEN       =', TOKEN);
  console.log('  NOTION_DATABASE_ID =', dbId);
  console.log('\n設定好之後，每次 push 就會自動同步到 Notion。');
}

main().catch(e => { console.error(e); process.exit(1); });
