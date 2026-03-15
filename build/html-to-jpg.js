const puppeteer = require('puppeteer-core');
const path = require('path');

async function htmlToJpg() {
  const htmlPath = path.resolve(__dirname, '..', '암송킹_소개.html');
  const outputPath = path.resolve(__dirname, '..', '암송킹_소개.jpg');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const page = await browser.newPage();

  // A4 너비 기준 (210mm ≈ 794px)
  await page.setViewport({ width: 794, height: 600 });
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // 전체 페이지 높이 계산
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

  // 뷰포트를 전체 높이로 설정
  await page.setViewport({ width: 794, height: bodyHeight });

  // 잠시 대기 (렌더링 완료)
  await new Promise(r => setTimeout(r, 500));

  // 전체 페이지를 1장의 JPG로 캡쳐
  await page.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 90,
    fullPage: true,
  });

  await browser.close();
  console.log('JPG 생성 완료:', outputPath);
}

htmlToJpg().catch(console.error);
