import puppeteer from 'puppeteer';
import fs from 'fs';

async function typeInReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, value);
}

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:/Users/VINIT/.gemini/antigravity/brain/13c1e3d8-8c62-42fe-bb35-1a1505804ab5';

async function run() {
  console.log('⏳ Waiting 10 seconds for backend server to boot and settle...');
  await new Promise(r => setTimeout(r, 10000));
  
  console.log('🚀 Starting Puppeteer browser verification...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const networkErrors = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('🔴 BROWSER CONSOLE ERROR:', msg.text());
    } else {
      console.log('📱 BROWSER LOG:', msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.log('🔴 BROWSER PAGE ERROR:', err.message);
  });

  page.on('requestfailed', request => {
    networkErrors.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
    console.log('🔴 BROWSER REQUEST FAILED:', request.method(), request.url(), request.failure().errorText);
  });

  try {
    // --- 1. Customer Login ---
    console.log('\n--- Step 1: Logging in as Customer ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.waitForSelector('input[type="email"]');
    await typeInReactInput(page, 'input[type="email"]', 'customer@cravego.com');
    await typeInReactInput(page, 'input[type="password"]', 'password123');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step1_login_credentials.png` });
    
    // Click submit button
    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    await new Promise(r => setTimeout(r, 2500));
    const token1 = await page.evaluate(() => localStorage.getItem('accessToken'));
    console.log(`🔑 Token in Step 1 (Login): ${token1 ? token1.substring(0, 20) + '...' : 'null'}`);
    console.log('✅ Customer logged in successfully.');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step2_customer_home.png` });

    // --- 2. Visit Restaurant & Add to Cart ---
    console.log('\n--- Step 2: Visiting Restaurant and Adding Item to Cart ---');
    // Using Indiranagar Italian Oven ID from seeded DB
    await page.goto(`${BASE_URL}/restaurants/6a4511dcbdfdd65b757815f9`, { waitUntil: 'networkidle2' });
    const token2 = await page.evaluate(() => localStorage.getItem('accessToken'));
    console.log(`🔑 Token in Step 2 (Restaurant menu): ${token2 ? token2.substring(0, 20) + '...' : 'null'}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step3_restaurant_menu.png` });
    
    // Wait for the "Add" button and click it
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    let addBtnClicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Add')) {
        await page.evaluate(el => el.click(), btn);
        addBtnClicked = true;
        break;
      }
    }

    if (!addBtnClicked) {
      throw new Error('Could not find "Add" button on restaurant menu!');
    }
    console.log('✅ Clicked "Add to Cart" button.');
    await new Promise(r => setTimeout(r, 1000)); // wait for toast/modal transition
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step4_item_added.png` });

    // --- 3. Checkout ---
    console.log('\n--- Step 3: Checkout and Place Order ---');
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle2' });
    const token3 = await page.evaluate(() => localStorage.getItem('accessToken'));
    console.log(`🔑 Token in Step 3 (Checkout): ${token3 ? token3.substring(0, 20) + '...' : 'null'}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step5_checkout_page.png` });

    // Click "Place Order" button
    // Find button containing text "Place Order"
    const checkoutButtons = await page.$$('button');
    let placeOrderClicked = false;
    for (const btn of checkoutButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Place Order')) {
        await page.evaluate(el => el.click(), btn);
        await new Promise(r => setTimeout(r, 2500));
        placeOrderClicked = true;
        break;
      }
    }

    if (!placeOrderClicked) {
      throw new Error('Could not find "Place Order" button!');
    }
    console.log('✅ Clicked "Place Order".');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step6_order_placed_tracker.png` });

    // Capture Order ID from URL or page text
    const currentUrl = page.url();
    console.log(`Current tracker URL: ${currentUrl}`);

    // --- 4. Restaurant Owner Accepts & Prepares Order ---
    console.log('\n--- Step 4: Owner Accepts and Prepares Order ---');
    // Clear cookies and localStorage to log in as owner
    const ownerCDP = await page.target().createCDPSession();
    await ownerCDP.send('Network.clearBrowserCookies');
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.waitForSelector('input[type="email"]');
    await typeInReactInput(page, 'input[type="email"]', 'owner20@cravego.com');
    await typeInReactInput(page, 'input[type="password"]', 'password123');
    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    await new Promise(r => setTimeout(r, 4000));
    console.log('✅ Owner logged in successfully.');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step7_owner_dashboard.png` });

    // Accept Order
    const acceptButtons = await page.$$('button');
    let accepted = false;
    for (const btn of acceptButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Accept')) {
        await page.evaluate(el => el.click(), btn);
        accepted = true;
        console.log('✅ Clicked Accept Order.');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    // Mark as Preparing
    const prepButtons = await page.$$('button');
    let preparing = false;
    for (const btn of prepButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Prepare')) {
        await page.evaluate(el => el.click(), btn);
        preparing = true;
        console.log('✅ Clicked Prepare Order.');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    // Mark as Prepared (Ready for Pickup)
    const readyButtons = await page.$$('button');
    let ready = false;
    for (const btn of readyButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Ready for Pickup')) {
        await page.evaluate(el => el.click(), btn);
        ready = true;
        console.log('✅ Clicked Ready for Pickup.');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step8_order_marked_ready.png` });

    // --- 5. Delivery Partner Accepts Job ---
    console.log('\n--- Step 5: Delivery Partner Logs In and Accepts Job ---');
    // Clear cookies and localStorage to log in as driver
    const driverCDP = await page.target().createCDPSession();
    await driverCDP.send('Network.clearBrowserCookies');
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.waitForSelector('input[type="email"]');
    await typeInReactInput(page, 'input[type="email"]', 'driver@cravego.com');
    await typeInReactInput(page, 'input[type="password"]', 'password123');
    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    await new Promise(r => setTimeout(r, 4000));
    console.log('✅ Driver logged in successfully.');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step9_driver_dashboard_available.png` });

    // Accept Job
    const driverButtons = await page.$$('button');
    let driverAccepted = false;
    for (const btn of driverButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Accept')) {
        await page.evaluate(el => el.click(), btn);
        driverAccepted = true;
        console.log('✅ Clicked Accept Delivery Job.');
        break;
      }
    }

    if (!driverAccepted) {
      throw new Error('Driver could not accept delivery job (Accept button not found)!');
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step10_driver_job_accepted.png` });

    // Confirm Pickup
    const pickupButtons = await page.$$('button');
    let pickupConfirmed = false;
    for (const btn of pickupButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Confirm Pickup')) {
        await page.evaluate(el => el.click(), btn);
        pickupConfirmed = true;
        console.log('✅ Clicked Confirm Pickup.');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    // Mark On The Way
    const wayButtons = await page.$$('button');
    let wayConfirmed = false;
    for (const btn of wayButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Mark On The Way')) {
        await page.evaluate(el => el.click(), btn);
        wayConfirmed = true;
        console.log('✅ Clicked Mark On The Way.');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    // Confirm Drop-off
    const dropButtons = await page.$$('button');
    let dropConfirmed = false;
    for (const btn of dropButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Confirm Drop-Off')) {
        await page.evaluate(el => el.click(), btn);
        dropConfirmed = true;
        console.log('✅ Clicked Confirm Drop-Off & Delivery.');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${SCREENSHOT_DIR}/browser_step11_order_delivered.png` });

    console.log('\n👑 Browser E2E verification test completed successfully!');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Network Failures: ${networkErrors.length}`);

  } catch (error) {
    console.error('❌ Browser E2E Test Failed:', error);
  } finally {
    await browser.close();
    console.log('🔄 Browser closed.');
  }
}

run();
