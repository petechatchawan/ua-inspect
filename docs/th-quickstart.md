# เริ่มต้นใช้งาน ua-inspect

คู่มือภาษาไทยแบบสั้น สำหรับใช้งาน `ua-inspect` เวอร์ชัน 1.5 ขึ้นไป

## ติดตั้ง

```bash
npm install ua-inspect
```

ไม่ต้องตั้งค่า ไม่มี runtime dependency และรองรับ ESM, CommonJS และ TypeScript

## อ่านค่า User-Agent

```ts
import { parse } from 'ua-inspect';

const info = parse(userAgent);

info.browser.name; // 'chrome' หรือ null
info.os.name; // 'windows' หรือ null
info.device.type; // 'desktop' หรือ null
```

ทุก field ที่ไม่รู้ค่าจะเป็น `null` ไม่มี string `"unknown"`

## Query และ version

```ts
import { atLeast, is, isBot } from 'ua-inspect';

if (is(info, { family: 'chromium', device: ['mobile', 'tablet'] })) {
    // Chromium บนมือถือหรือแท็บเล็ต
}

if (isBot(info)) {
    // bot, crawler หรือ ai-crawler
}

if (atLeast(info.browser.version, '130')) {
    // version 130 ขึ้นไป
}
```

`is()` ใช้ key ที่พิมพ์ผิดไม่ได้ถ้าเป็น TypeScript และใน development จะมี warning ถ้าใส่ key ที่ไม่รู้จักหรือ query ว่าง

## แสดงผลให้คนอ่าน

```ts
import { describe, label } from 'ua-inspect';

label('browser', info.browser.name); // 'Google Chrome' หรือ 'Unknown'
describe(info); // 'Google Chrome 150.0.0.0 on Windows 10 (Desktop)'
```

## Request และ Client Hints

```ts
import { parseRequest } from 'ua-inspect/server';

const info = parseRequest(request);
```

`parseRequest()` อ่าน `Sec-CH-UA-*` ที่มีอยู่ใน request แต่ไม่ได้ส่ง `Accept-CH` ให้เอง

## ฝั่ง browser

```ts
import { detect } from 'ua-inspect/browser';

const info = await detect({ highEntropy: true });
```

`detect()` ใช้ได้เฉพาะใน browser window หรือ worker ถ้าเรียกฝั่ง server จะ throw ให้ใช้ `parse()` หรือ `parseRequest()` แทน

## LINE และ LIFF

```ts
import { is } from 'ua-inspect';

is(info, { context: 'line' }); // true เมื่ออยู่ใน LINE in-app browser
is(info, { app: 'line' }); // true ทั้ง LINE และ LIFF
```

`parse()` บอกได้แค่ว่าเป็น LINE in-app browser ส่วน LIFF ต้องใช้ runtime adapter:

```ts
import { detect } from 'ua-inspect/browser';

const info = await detect({ liff });
is(info, { context: 'liff' }); // true เมื่อ runtime ยืนยัน
```

## ข้อควรระวัง

- Chrome บนมือถือคือ `chrome-mobile` ไม่ใช่ `chrome`
- Safari บน iOS และ iPadOS คือ `safari-mobile`
- iPad คือ `ipados` ไม่ใช่ `ios`
- `Version` เป็น object ไม่ใช่ string ให้ใช้ `atLeast()` หรืออ่าน `.major`
- `is(info, {})` คืน `true` เสมอ ต้องระบุ key อย่างน้อยหนึ่งตัว
- `detect()` ใช้ฝั่ง server ไม่ได้
- `parse(request)` จะได้ผลว่าง ให้ใช้ `parseRequest(request)`

## อ่านต่อ

- [README](../README.md): เอกสารเต็ม
- [llms.txt](../llms.txt): cheat sheet สำหรับ AI
- [CONTRIBUTING](../CONTRIBUTING.md): นโยบาย semver และการเพิ่ม catalog
