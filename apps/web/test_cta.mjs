import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Mobile context
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: '/Users/carlosbelteton/.gemini/antigravity/brain/248f006c-d636-4723-9e90-76f0cb72427a/' }
  });
  const mobilePage = await mobileContext.newPage();
  
  await mobilePage.goto('http://localhost:5173');
  
  // Login as operator
  await mobilePage.click('button:has-text("Operador de Campo")');
  await mobilePage.fill('input[type="email"]', 'operario_1@uat.com');
  await mobilePage.fill('input[type="password"]', 'Demo2026!');
  await mobilePage.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await mobilePage.waitForSelector('text=Módulo de Campo', { timeout: 15000 });
  // Wait for the floating button
  await mobilePage.waitForSelector('button.w-14.h-14', { timeout: 15000 });
  await mobilePage.screenshot({ path: '/Users/carlosbelteton/.gemini/antigravity/brain/248f006c-d636-4723-9e90-76f0cb72427a/mobile_cta_visible.png' });
  
  // Click CTA
  await mobilePage.click('button.w-14.h-14');
  await mobilePage.waitForSelector('text=Crear Registro', { timeout: 5000 });
  await mobilePage.screenshot({ path: '/Users/carlosbelteton/.gemini/antigravity/brain/248f006c-d636-4723-9e90-76f0cb72427a/mobile_modal_open.png' });
  
  // Fill title
  await mobilePage.fill('input[placeholder="Ej: Fuga de agua detectada"]', 'Test Automático ' + Date.now());
  await mobilePage.screenshot({ path: '/Users/carlosbelteton/.gemini/antigravity/brain/248f006c-d636-4723-9e90-76f0cb72427a/mobile_modal_filled.png' });
  
  // Submit
  await mobilePage.click('button[type="submit"]:has-text("Crear Registro")');
  await mobilePage.waitForSelector('text=Registro creado correctamente', { timeout: 5000 });
  await mobilePage.waitForTimeout(2000); // give it a sec to show in list
  await mobilePage.screenshot({ path: '/Users/carlosbelteton/.gemini/antigravity/brain/248f006c-d636-4723-9e90-76f0cb72427a/mobile_record_created.png' });
  
  await mobileContext.close();
  
  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const desktopPage = await desktopContext.newPage();
  
  await desktopPage.goto('http://localhost:5173');
  await desktopPage.waitForTimeout(2000);
  
  // Login as admin or operator (use global admin to test desktop)
  await desktopPage.click('button:has-text("Administrador / PM")');
  await desktopPage.fill('input[type="email"]', 'admin@demo.com');
  await desktopPage.fill('input[type="password"]', 'password123');
  await desktopPage.click('button[type="submit"]');
  
  await desktopPage.waitForSelector('text=Field Command Center', { timeout: 15000 });
  await desktopPage.click('text=Ir a Campo');
  
  await desktopPage.waitForSelector('button:has-text("Crear tarea")', { timeout: 15000 });
  await desktopPage.screenshot({ path: '/Users/carlosbelteton/.gemini/antigravity/brain/248f006c-d636-4723-9e90-76f0cb72427a/desktop_cta_visible.png' });
  
  await desktopContext.close();
  await browser.close();
  
  console.log('Playwright test completed successfully.');
})();
