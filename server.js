/* LOCAL HOSTING
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

app.get('/qr', async (req, res) => {
  const data = req.query.data;
  if (!data) {
    return res.status(400).send('Parameter "data" fehlt.');
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();

    // Link zu deinem auf Vercel gehosteten Frontend
    const url = `https://edih-qr-generator.vercel.app/index.html`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#url-input');

    await page.evaluate((value) => {
      const input = document.getElementById('url-input');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, data);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const hasSvg = (await page.$('#qr-code svg')) !== null;

    if (hasSvg) {
      const svg = await page.$eval('#qr-code svg', el => el.outerHTML);
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    } 

    await page.waitForSelector('#qr-code canvas', { timeout: 5000 });
    const dataUrl = await page.$eval('#qr-code canvas', canvas => canvas.toDataURL());
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(base64Data, 'base64'));

  } catch (error) {
    console.error('Fehler beim Generieren des QR-Codes:', error);
    res.status(500).send('Fehler beim Generieren des QR-Codes');
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
*/

const express = require('express');
const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium');

const app = express();
const port = process.env.PORT || 3000;

app.get('/qr', async (req, res) => {
  const data = req.query.data;
  if (!data) return res.status(400).send('Parameter "data" fehlt.');

  let browser;
  try {
    browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});

    const page = await browser.newPage();

    const url = `https://edih-qr-generator.vercel.app/index.html`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#url-input');

    await page.evaluate((value) => {
      const input = document.getElementById('url-input');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, data);

    await page.waitForTimeout(1500);

    const hasSvg = (await page.$('#qr-code svg')) !== null;

    if (hasSvg) {
      const svg = await page.$eval('#qr-code svg', el => el.outerHTML);
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }

    await page.waitForSelector('#qr-code canvas', { timeout: 5000 });
    const dataUrl = await page.$eval('#qr-code canvas', canvas => canvas.toDataURL());
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(base64Data, 'base64'));

  } catch (error) {
    console.error('Fehler beim Generieren des QR-Codes:', error);
    res.status(500).send('Fehler beim Generieren des QR-Codes');
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
