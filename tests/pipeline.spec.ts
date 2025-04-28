// tests/pipeline.spec.ts
import { test, expect, Page } from '@playwright/test';

// --- Constants and Test Data ---
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';
const PIPELINE_URL = `${BASE_URL}/pipeline`; // Adjust if your pipeline route is different

const TEST_USER_EMAIL = process.env.PLAYWRIGHT_TEST_USER_EMAIL || 'test@example.com'; // Store test credentials securely
const TEST_USER_PASSWORD = process.env.PLAYWRIGHT_TEST_USER_PASSWORD || 'password';

// Helper function for logging in
async function login(page: Page) {
  console.log(`Attempting to navigate to login page: ${BASE_URL}/login`);
  await page.goto(`${BASE_URL}/login`);
  console.log('Navigation to login page initiated.');

  // Add a short explicit wait after navigation before interacting
  console.log('Waiting briefly after navigation...');
  await page.waitForTimeout(1000); // Wait 1 second

  // --- Selectors based on screenshots --- 
  const emailInputSelector = 'input[placeholder="sarah@example.com"]'; // Using placeholder
  const passwordInputSelector = 'input[type="password"]'; // Assuming type="password"
  const submitButtonSelector = 'button:has-text("Sign in")'; // Using button text

  const emailInput = page.locator(emailInputSelector);
  console.log(`Waiting for email input using selector: ${emailInputSelector}`);
  try {
     await expect(emailInput).toBeVisible({ timeout: 10000 });
     console.log('Email input is visible. Filling email...');
     await emailInput.fill(TEST_USER_EMAIL);
  } catch (e) {
     console.error('Failed to find or fill email input:', e);
     await page.screenshot({ path: 'logs/login-email-error.png' });
     throw e;
  }

  const passwordInput = page.locator(passwordInputSelector);
  console.log(`Waiting for password input using selector: ${passwordInputSelector}`);
   try {
      await expect(passwordInput).toBeVisible({ timeout: 5000 });
      console.log('Password input is visible. Filling password...');
      await passwordInput.fill(TEST_USER_PASSWORD);
   } catch (e) {
      console.error('Failed to find or fill password input:', e);
      await page.screenshot({ path: 'logs/login-password-error.png' });
      throw e;
   }

  const submitButton = page.locator(submitButtonSelector);
  console.log(`Waiting for submit button using selector: ${submitButtonSelector}`);
   try {
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      console.log('Submit button is enabled. Clicking...');
      await submitButton.click();
   } catch (e) {
      console.error('Failed to find or click submit button:', e);
      await page.screenshot({ path: 'logs/login-submit-error.png' });
      throw e;
   }

  // Wait for navigation to a post-login page (e.g., dashboard or pipeline)
  console.log('Waiting for navigation after login...');
  try {
      await page.waitForURL(url => url.pathname !== '/login', { timeout: 15000 }); // Increased wait
      console.log(`Navigation successful. Current URL: ${page.url()}`);
  } catch(e) {
       console.error('Navigation after login failed or timed out.');
       await page.screenshot({ path: 'logs/login-navigation-error.png' });
       throw e;
  }

  console.log('Login function completed successfully.');
}

// --- Test Suite ---
test.describe('Pipeline and Deal Management', () => {
  let page: Page;

  // Increase timeout for beforeAll hook
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page);
    // await page.context().storageState({ path: 'storageState.json' });
  });
  test.beforeAll.timeout = 60000; // Increase timeout to 60 seconds

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    // Navigate to pipeline page before each test
    console.log(`Navigating to pipeline URL: ${PIPELINE_URL}`);
    await page.goto(PIPELINE_URL);
    
    // Explicitly wait for the pipeline URL to be loaded
    console.log(`Waiting for URL to be ${PIPELINE_URL}...`);
    try {
        await page.waitForURL(PIPELINE_URL, { timeout: 10000 }); // Wait up to 10s for the correct URL
        console.log(`Successfully navigated to ${page.url()}`);
    } catch (e) {
        console.error(`Failed to navigate to ${PIPELINE_URL}. Current URL: ${page.url()}`);
        await page.screenshot({ path: 'logs/pipeline-navigation-error.png' });
        throw e;
    }

    // Basic wait to ensure columns are likely loaded
    const pipelineColumnSelector = '[data-testid^="pipeline-column-"]';
    const columnHeaderSelector = `${pipelineColumnSelector} h3`; // Selector for header inside column
    
    console.log(`Waiting for pipeline column header: ${columnHeaderSelector}`);
    try {
        // Wait for the header first - implies the column structure exists
        await expect(page.locator(columnHeaderSelector).first()).toBeVisible({ timeout: 15000 });
        console.log('Pipeline column header found.');
         // Now confirm the column itself is visible (should be immediate if header is visible)
        await expect(page.locator(pipelineColumnSelector).first()).toBeVisible({ timeout: 1000 }); 
        console.log('Pipeline column container found.');
    } catch (e) {
         console.error(`Failed to find pipeline column/header. Selector used: ${columnHeaderSelector}`);
         await page.screenshot({ path: 'logs/pipeline-column-error.png' });
         throw e;
    }
  });

  // --- Test Cases ---

  test('should load pipeline stages and deals', async () => {
    // Verify stage columns are present using the new selector
    await expect(page.locator('[data-testid^="pipeline-column-"] h3')).toHaveCountGreaterThan(2);

    // Optional: Verify a specific known stage name exists
    await expect(page.locator('[data-testid^="pipeline-column-"] h3:has-text("Lead")')).toBeVisible(); 

    // Optional: Verify at least one deal card is visible (if data exists)
    // await expect(page.locator('[data-testid^="deal-card-"]')).toHaveCountGreaterThan(0);
  });

  test('should create a new deal with all fields', async () => {
    const uniqueId = Date.now();
    const newDealData = {
      name: `New Test Deal ${uniqueId}`,
      company: `Test Co ${uniqueId}`,
      contactName: `Test Contact ${uniqueId}`,
      amount: '5000',
      closeDate: '2025-11-30',
      notes: `Description for new deal ${uniqueId}`,
      probability: '10', // Matches default for 'Lead' typically
      nextAction: `Follow up action ${uniqueId}`,
      dealSize: 'small',
      priority: 'low',
      leadSourceType: 'inbound',
      leadSourceChannel: 'website',
      // --- Find the ID for the first stage (e.g., 'Lead') ---
      // This might require fetching stages beforehand or using a known ID
      // For simplicity, let's assume we click 'Add Deal' in the first column
    };

    // --- 1. Open Add Deal Modal ---
    // Click the 'Add Deal' button in the first column 
    await page.locator('[data-testid^="pipeline-column-"]').first().locator('button:has-text("Add deal")').click();

    // Wait for modal
    const modalSelector = '#edit-deal-modal-content'; // Use the ID from EditDealModal
    await expect(page.locator(modalSelector)).toBeVisible();

    // --- 2. Fill Form ---
    await page.locator(modalSelector).locator('input#dealName').fill(newDealData.name);
    await page.locator(modalSelector).locator('input#company').fill(newDealData.company);
    await page.locator(modalSelector).locator('input#contactName').fill(newDealData.contactName);
    await page.locator(modalSelector).locator('input#amount').fill(newDealData.amount);
    await page.locator(modalSelector).locator('input#closeDate').fill(newDealData.closeDate);
    await page.locator(modalSelector).locator('textarea#notes').fill(newDealData.notes);
    await page.locator(modalSelector).locator('input#probability').fill(newDealData.probability);
    await page.locator(modalSelector).locator('select#priority').selectOption({ value: newDealData.priority });
    await page.locator(modalSelector).locator('select#dealSize').selectOption({ value: newDealData.dealSize });
    await page.locator(modalSelector).locator('input#nextAction').fill(newDealData.nextAction); // Ensure this input exists with id="nextAction"

    // Lead Source - Adjust selectors based on your implementation
    await page.locator(modalSelector).locator(`button[aria-label*="${newDealData.leadSourceType}"]`).click(); // Find button for type
    await page.locator(modalSelector).locator(`[data-testid="channel-option-${newDealData.leadSourceChannel}"]`).click(); // Find channel option

    // --- 3. Save ---
    await page.locator(modalSelector).locator('button[aria-label="Save deal"]').click();

    // --- 4. Verify ---
    await expect(page.locator(modalSelector)).not.toBeVisible({ timeout: 10000 }); // Wait longer for save + close
    // Verify card appears in the correct column (assuming first column is 'Lead')
    const newCardSelector = `[data-testid="deal-card-${newDealData.name}"]`; // Use data-testid if possible
    await expect(page.locator('[data-testid^="pipeline-column-"]').first().locator(newCardSelector)).toBeVisible();
    // Verify basic info on card
    await expect(page.locator(newCardSelector).locator(`text=${newDealData.company}`)).toBeVisible();
    // await expect(page.locator(newCardSelector).locator(`text=£${newDealData.amount}`)).toBeVisible(); // Check formatting

    // --- 5. (Optional) Verify All Fields Saved Correctly ---
    await page.locator(newCardSelector).click();
    await expect(page.locator(modalSelector)).toBeVisible();
    await expect(page.locator(modalSelector).locator('input#dealName')).toHaveValue(newDealData.name);
    await expect(page.locator(modalSelector).locator('input#company')).toHaveValue(newDealData.company);
    await expect(page.locator(modalSelector).locator('input#contactName')).toHaveValue(newDealData.contactName);
    await expect(page.locator(modalSelector).locator('input#amount')).toHaveValue(newDealData.amount);
    await expect(page.locator(modalSelector).locator('input#closeDate')).toHaveValue(newDealData.closeDate);
    await expect(page.locator(modalSelector).locator('textarea#notes')).toHaveValue(newDealData.notes);
    await expect(page.locator(modalSelector).locator('input#probability')).toHaveValue(newDealData.probability);
    await expect(page.locator(modalSelector).locator('select#priority')).toHaveValue(newDealData.priority);
    await expect(page.locator(modalSelector).locator('select#dealSize')).toHaveValue(newDealData.dealSize);
    await expect(page.locator(modalSelector).locator('input#nextAction')).toHaveValue(newDealData.nextAction);
    await expect(page.locator(modalSelector).locator(`button[aria-label*="${newDealData.leadSourceType}"][aria-pressed="true"]`)).toBeVisible();
    await expect(page.locator(modalSelector).locator(`[data-testid="channel-option-${newDealData.leadSourceChannel}"][aria-selected="true"]`)).toBeVisible(); // Assuming aria-selected

    // Close modal
    await page.locator(modalSelector).locator('button[aria-label="Close modal"]').click();
    await expect(page.locator(modalSelector)).not.toBeVisible();

  });

  test('should edit all fields of an existing deal', async () => {
    // --- Prerequisite: Ensure a test deal exists ---
    // This might involve seeding data or using the deal created in the previous test.
    // For simplicity, let's assume the 'create' test ran first and we edit that deal.
    // It's more robust to create a specific deal for this test in a beforeAll/beforeEach.

    const dealNameToEdit = page.locator('[data-testid^="deal-card-New Test Deal"]').first(); // Find a deal card created by previous test
    const initialDealName = await dealNameToEdit.getAttribute('data-testid'); // Or extract name differently
    await expect(dealNameToEdit).toBeVisible();
    await dealNameToEdit.click();

    const modalSelector = '#edit-deal-modal-content';
    await expect(page.locator(modalSelector)).toBeVisible();

    // --- Edit Data ---
    const uniqueId = Date.now();
    const editedData = {
      name: `Edited Deal ${uniqueId}`,
      company: `Edited Co ${uniqueId}`,
      contactName: `Edited Contact ${uniqueId}`,
      amount: '98765',
      closeDate: '2026-01-15',
      notes: `Edited description for deal ${uniqueId}`,
      probability: '85',
      nextAction: `Edited follow up ${uniqueId}`,
      dealSize: 'large',
      priority: 'critical',
      leadSourceType: 'event',
      leadSourceChannel: 'conference'
    };

    // --- Fill Form with Edits ---
    await page.locator(modalSelector).locator('input#dealName').fill(editedData.name);
    await page.locator(modalSelector).locator('input#company').fill(editedData.company);
    await page.locator(modalSelector).locator('input#contactName').fill(editedData.contactName);
    await page.locator(modalSelector).locator('input#amount').fill(editedData.amount);
    await page.locator(modalSelector).locator('input#closeDate').fill(editedData.closeDate);
    await page.locator(modalSelector).locator('textarea#notes').fill(editedData.notes);
    await page.locator(modalSelector).locator('input#probability').fill(editedData.probability);
    await page.locator(modalSelector).locator('select#priority').selectOption({ value: editedData.priority });
    await page.locator(modalSelector).locator('select#dealSize').selectOption({ value: editedData.dealSize });
    await page.locator(modalSelector).locator('input#nextAction').fill(editedData.nextAction);
    await page.locator(modalSelector).locator(`button[aria-label*="${editedData.leadSourceType}"]`).click();
    await page.locator(modalSelector).locator(`[data-testid="channel-option-${editedData.leadSourceChannel}"]`).click();

    // --- Save ---
    await page.locator(modalSelector).locator('button[aria-label="Save deal"]').click();

    // --- Verify Save ---
    await expect(page.locator(modalSelector)).not.toBeVisible({ timeout: 10000 });
    const editedCardSelector = `[data-testid="deal-card-${editedData.name}"]`;
    await expect(page.locator(editedCardSelector)).toBeVisible(); // Check if card with new name exists

    // --- Re-open and Verify ALL Fields ---
    await page.locator(editedCardSelector).click();
    await expect(page.locator(modalSelector)).toBeVisible();
    // Assertions for ALL fields matching editedData (similar to create test verification)
    await expect(page.locator(modalSelector).locator('input#dealName')).toHaveValue(editedData.name);
    await expect(page.locator(modalSelector).locator('input#company')).toHaveValue(editedData.company);
    await expect(page.locator(modalSelector).locator('input#contactName')).toHaveValue(editedData.contactName);
    await expect(page.locator(modalSelector).locator('input#amount')).toHaveValue(editedData.amount);
    await expect(page.locator(modalSelector).locator('input#closeDate')).toHaveValue(editedData.closeDate);
    await expect(page.locator(modalSelector).locator('textarea#notes')).toHaveValue(editedData.notes);
    await expect(page.locator(modalSelector).locator('input#probability')).toHaveValue(editedData.probability);
    await expect(page.locator(modalSelector).locator('select#priority')).toHaveValue(editedData.priority);
    await expect(page.locator(modalSelector).locator('select#dealSize')).toHaveValue(editedData.dealSize);
    await expect(page.locator(modalSelector).locator('input#nextAction')).toHaveValue(editedData.nextAction);
    await expect(page.locator(modalSelector).locator(`button[aria-label*="${editedData.leadSourceType}"][aria-pressed="true"]`)).toBeVisible();
    await expect(page.locator(modalSelector).locator(`[data-testid="channel-option-${editedData.leadSourceChannel}"][aria-selected="true"]`)).toBeVisible();

    // Close modal
     await page.locator(modalSelector).locator('button[aria-label="Close modal"]').click();
     await expect(page.locator(modalSelector)).not.toBeVisible();
  });

  test('should drag and drop a deal to a different stage', async () => {
    // --- Prerequisite: Need at least one deal and multiple stages ---
    const dealCard = page.locator('[data-testid^="deal-card-"]').first(); // Select the first deal card
    // Find the column using the new data-testid
    const originalColumn = dealCard.locator('xpath=ancestor::*[@data-testid^="pipeline-column-"]'); 
    const targetColumn = page.locator('[data-testid^="pipeline-column-"]').nth(1); // Target the second column

    await expect(dealCard).toBeVisible();
    await expect(targetColumn).toBeVisible();

    const originalColumnId = await originalColumn.getAttribute('data-testid'); 
    const targetColumnId = await targetColumn.getAttribute('data-testid');
    expect(originalColumnId).not.toEqual(targetColumnId); // Ensure target is different

    // --- Perform Drag and Drop ---
    await dealCard.dragTo(targetColumn);

    // --- Verification ---
    // Wait for the card to appear in the new column
    await expect(targetColumn.locator(dealCard)).toBeVisible({ timeout: 10000 });
    // Ensure it's gone from the original column
    await expect(originalColumn.locator(dealCard)).not.toBeVisible();

    // Optional: Add DB/API check here to verify stage_id was updated
  });

  test('should delete a deal', async () => {
      // --- Prerequisite: Ensure a test deal exists to delete ---
      // Best practice: create a specific deal for deletion in this test or beforeEach
      const dealNameToDelete = page.locator('[data-testid^="deal-card-Edited Deal"]').first(); // Find deal from edit test
      const dealTestId = await dealNameToDelete.getAttribute('data-testid');
      await expect(dealNameToDelete).toBeVisible();
      await dealNameToDelete.click();

      const modalSelector = '#edit-deal-modal-content';
      await expect(page.locator(modalSelector)).toBeVisible();

      // --- Delete ---
      page.on('dialog', dialog => dialog.accept()); // Auto-accept the confirm() dialog
      await page.locator(modalSelector).locator('button[aria-label="Delete deal"]').click();

      // --- Verify ---
      await expect(page.locator(modalSelector)).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator(`[data-testid="${dealTestId}"]`)).not.toBeVisible(); // Verify card removed from UI

      // Optional: Add DB/API check to verify deal deletion
  });

}); 