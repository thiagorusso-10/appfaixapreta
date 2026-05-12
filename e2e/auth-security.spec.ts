import { test, expect } from '@playwright/test';

test.describe('Security & Authentication Tests', () => {
  
  test('Landing page should be public', async ({ page }) => {
    // A página inicial (/) deve carregar sem redirecionar para login
    await page.goto('/');
    
    // Verifica se não fomos redirecionados para o clerk (sign-in)
    expect(page.url()).not.toContain('sign-in');
  });

  test('Dashboard should be protected and redirect to login', async ({ page }) => {
    // Tenta acessar o dashboard sem estar logado
    await page.goto('/dashboard');
    
    // O middleware deve interceptar e redirecionar para o auth provider do Clerk
    // Como estamos apontando pro localhost, a URL deve conter accounts.clerk.com ou o proxy local do Clerk
    await page.waitForURL(/sign-in|accounts\.clerk/);
    
    expect(page.url()).toMatch(/sign-in|accounts\.clerk/);
  });

  test('Auth Sync should be protected', async ({ page }) => {
    // auth-sync só deve ser acessado por usuários com token JWT válido
    await page.goto('/auth-sync');
    
    await page.waitForURL(/sign-in|accounts\.clerk/);
    expect(page.url()).toMatch(/sign-in|accounts\.clerk/);
  });
});
