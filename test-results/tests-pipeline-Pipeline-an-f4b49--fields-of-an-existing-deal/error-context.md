# Test info

- Name: Pipeline and Deal Management >> should edit all fields of an existing deal
- Location: /Volumes/X10 Pro/Github Desktop/sales-dashboard-bolt-vite/tests/pipeline.spec.ts:218:3

# Error details

```
Error: Timed out 15000ms waiting for expect(locator).toBeVisible()

Locator: locator('[data-testid^="pipeline-column-"] h3').first()
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 15000ms
  - waiting for locator('[data-testid^="pipeline-column-"] h3').first()

    at /Volumes/X10 Pro/Github Desktop/sales-dashboard-bolt-vite/tests/pipeline.spec.ts:115:66
```

# Page snapshot

```yaml
- heading "Welcome back" [level=1]
- paragraph: Sign in to your account to continue
- text: Email Address
- img
- textbox "sarah@example.com"
- text: Password
- link "Forgot Password?":
  - /url: /auth/forgot-password
- img
- textbox "••••••••"
- button "Sign in"
- link "Create an account":
  - /url: /auth/signup
  - text: Create an account
  - img
- region "Notifications alt+T"
```

# Test source

```ts
   15 |   console.log('Navigation to login page initiated.');
   16 |
   17 |   // Add a short explicit wait after navigation before interacting
   18 |   console.log('Waiting briefly after navigation...');
   19 |   await page.waitForTimeout(1000); // Wait 1 second
   20 |
   21 |   // --- Selectors based on screenshots --- 
   22 |   const emailInputSelector = 'input[placeholder="sarah@example.com"]'; // Using placeholder
   23 |   const passwordInputSelector = 'input[type="password"]'; // Assuming type="password"
   24 |   const submitButtonSelector = 'button:has-text("Sign in")'; // Using button text
   25 |
   26 |   const emailInput = page.locator(emailInputSelector);
   27 |   console.log(`Waiting for email input using selector: ${emailInputSelector}`);
   28 |   try {
   29 |      await expect(emailInput).toBeVisible({ timeout: 10000 });
   30 |      console.log('Email input is visible. Filling email...');
   31 |      await emailInput.fill(TEST_USER_EMAIL);
   32 |   } catch (e) {
   33 |      console.error('Failed to find or fill email input:', e);
   34 |      await page.screenshot({ path: 'logs/login-email-error.png' });
   35 |      throw e;
   36 |   }
   37 |
   38 |   const passwordInput = page.locator(passwordInputSelector);
   39 |   console.log(`Waiting for password input using selector: ${passwordInputSelector}`);
   40 |    try {
   41 |       await expect(passwordInput).toBeVisible({ timeout: 5000 });
   42 |       console.log('Password input is visible. Filling password...');
   43 |       await passwordInput.fill(TEST_USER_PASSWORD);
   44 |    } catch (e) {
   45 |       console.error('Failed to find or fill password input:', e);
   46 |       await page.screenshot({ path: 'logs/login-password-error.png' });
   47 |       throw e;
   48 |    }
   49 |
   50 |   const submitButton = page.locator(submitButtonSelector);
   51 |   console.log(`Waiting for submit button using selector: ${submitButtonSelector}`);
   52 |    try {
   53 |       await expect(submitButton).toBeEnabled({ timeout: 5000 });
   54 |       console.log('Submit button is enabled. Clicking...');
   55 |       await submitButton.click();
   56 |    } catch (e) {
   57 |       console.error('Failed to find or click submit button:', e);
   58 |       await page.screenshot({ path: 'logs/login-submit-error.png' });
   59 |       throw e;
   60 |    }
   61 |
   62 |   // Wait for navigation to a post-login page (e.g., dashboard or pipeline)
   63 |   console.log('Waiting for navigation after login...');
   64 |   try {
   65 |       await page.waitForURL(url => url.pathname !== '/login', { timeout: 15000 }); // Increased wait
   66 |       console.log(`Navigation successful. Current URL: ${page.url()}`);
   67 |   } catch(e) {
   68 |        console.error('Navigation after login failed or timed out.');
   69 |        await page.screenshot({ path: 'logs/login-navigation-error.png' });
   70 |        throw e;
   71 |   }
   72 |
   73 |   console.log('Login function completed successfully.');
   74 | }
   75 |
   76 | // --- Test Suite ---
   77 | test.describe('Pipeline and Deal Management', () => {
   78 |   let page: Page;
   79 |
   80 |   // Increase timeout for beforeAll hook
   81 |   test.beforeAll(async ({ browser }) => {
   82 |     page = await browser.newPage();
   83 |     await login(page);
   84 |     // await page.context().storageState({ path: 'storageState.json' });
   85 |   });
   86 |   test.beforeAll.timeout = 60000; // Increase timeout to 60 seconds
   87 |
   88 |   test.afterAll(async () => {
   89 |     await page.close();
   90 |   });
   91 |
   92 |   test.beforeEach(async () => {
   93 |     // Navigate to pipeline page before each test
   94 |     console.log(`Navigating to pipeline URL: ${PIPELINE_URL}`);
   95 |     await page.goto(PIPELINE_URL);
   96 |     
   97 |     // Explicitly wait for the pipeline URL to be loaded
   98 |     console.log(`Waiting for URL to be ${PIPELINE_URL}...`);
   99 |     try {
  100 |         await page.waitForURL(PIPELINE_URL, { timeout: 10000 }); // Wait up to 10s for the correct URL
  101 |         console.log(`Successfully navigated to ${page.url()}`);
  102 |     } catch (e) {
  103 |         console.error(`Failed to navigate to ${PIPELINE_URL}. Current URL: ${page.url()}`);
  104 |         await page.screenshot({ path: 'logs/pipeline-navigation-error.png' });
  105 |         throw e;
  106 |     }
  107 |
  108 |     // Basic wait to ensure columns are likely loaded
  109 |     const pipelineColumnSelector = '[data-testid^="pipeline-column-"]';
  110 |     const columnHeaderSelector = `${pipelineColumnSelector} h3`; // Selector for header inside column
  111 |     
  112 |     console.log(`Waiting for pipeline column header: ${columnHeaderSelector}`);
  113 |     try {
  114 |         // Wait for the header first - implies the column structure exists
> 115 |         await expect(page.locator(columnHeaderSelector).first()).toBeVisible({ timeout: 15000 });
      |                                                                  ^ Error: Timed out 15000ms waiting for expect(locator).toBeVisible()
  116 |         console.log('Pipeline column header found.');
  117 |          // Now confirm the column itself is visible (should be immediate if header is visible)
  118 |         await expect(page.locator(pipelineColumnSelector).first()).toBeVisible({ timeout: 1000 }); 
  119 |         console.log('Pipeline column container found.');
  120 |     } catch (e) {
  121 |          console.error(`Failed to find pipeline column/header. Selector used: ${columnHeaderSelector}`);
  122 |          await page.screenshot({ path: 'logs/pipeline-column-error.png' });
  123 |          throw e;
  124 |     }
  125 |   });
  126 |
  127 |   // --- Test Cases ---
  128 |
  129 |   test('should load pipeline stages and deals', async () => {
  130 |     // Verify stage columns are present using the new selector
  131 |     await expect(page.locator('[data-testid^="pipeline-column-"] h3')).toHaveCountGreaterThan(2);
  132 |
  133 |     // Optional: Verify a specific known stage name exists
  134 |     await expect(page.locator('[data-testid^="pipeline-column-"] h3:has-text("Lead")')).toBeVisible(); 
  135 |
  136 |     // Optional: Verify at least one deal card is visible (if data exists)
  137 |     // await expect(page.locator('[data-testid^="deal-card-"]')).toHaveCountGreaterThan(0);
  138 |   });
  139 |
  140 |   test('should create a new deal with all fields', async () => {
  141 |     const uniqueId = Date.now();
  142 |     const newDealData = {
  143 |       name: `New Test Deal ${uniqueId}`,
  144 |       company: `Test Co ${uniqueId}`,
  145 |       contactName: `Test Contact ${uniqueId}`,
  146 |       amount: '5000',
  147 |       closeDate: '2025-11-30',
  148 |       notes: `Description for new deal ${uniqueId}`,
  149 |       probability: '10', // Matches default for 'Lead' typically
  150 |       nextAction: `Follow up action ${uniqueId}`,
  151 |       dealSize: 'small',
  152 |       priority: 'low',
  153 |       leadSourceType: 'inbound',
  154 |       leadSourceChannel: 'website',
  155 |       // --- Find the ID for the first stage (e.g., 'Lead') ---
  156 |       // This might require fetching stages beforehand or using a known ID
  157 |       // For simplicity, let's assume we click 'Add Deal' in the first column
  158 |     };
  159 |
  160 |     // --- 1. Open Add Deal Modal ---
  161 |     // Click the 'Add Deal' button in the first column 
  162 |     await page.locator('[data-testid^="pipeline-column-"]').first().locator('button:has-text("Add deal")').click();
  163 |
  164 |     // Wait for modal
  165 |     const modalSelector = '#edit-deal-modal-content'; // Use the ID from EditDealModal
  166 |     await expect(page.locator(modalSelector)).toBeVisible();
  167 |
  168 |     // --- 2. Fill Form ---
  169 |     await page.locator(modalSelector).locator('input#dealName').fill(newDealData.name);
  170 |     await page.locator(modalSelector).locator('input#company').fill(newDealData.company);
  171 |     await page.locator(modalSelector).locator('input#contactName').fill(newDealData.contactName);
  172 |     await page.locator(modalSelector).locator('input#amount').fill(newDealData.amount);
  173 |     await page.locator(modalSelector).locator('input#closeDate').fill(newDealData.closeDate);
  174 |     await page.locator(modalSelector).locator('textarea#notes').fill(newDealData.notes);
  175 |     await page.locator(modalSelector).locator('input#probability').fill(newDealData.probability);
  176 |     await page.locator(modalSelector).locator('select#priority').selectOption({ value: newDealData.priority });
  177 |     await page.locator(modalSelector).locator('select#dealSize').selectOption({ value: newDealData.dealSize });
  178 |     await page.locator(modalSelector).locator('input#nextAction').fill(newDealData.nextAction); // Ensure this input exists with id="nextAction"
  179 |
  180 |     // Lead Source - Adjust selectors based on your implementation
  181 |     await page.locator(modalSelector).locator(`button[aria-label*="${newDealData.leadSourceType}"]`).click(); // Find button for type
  182 |     await page.locator(modalSelector).locator(`[data-testid="channel-option-${newDealData.leadSourceChannel}"]`).click(); // Find channel option
  183 |
  184 |     // --- 3. Save ---
  185 |     await page.locator(modalSelector).locator('button[aria-label="Save deal"]').click();
  186 |
  187 |     // --- 4. Verify ---
  188 |     await expect(page.locator(modalSelector)).not.toBeVisible({ timeout: 10000 }); // Wait longer for save + close
  189 |     // Verify card appears in the correct column (assuming first column is 'Lead')
  190 |     const newCardSelector = `[data-testid="deal-card-${newDealData.name}"]`; // Use data-testid if possible
  191 |     await expect(page.locator('[data-testid^="pipeline-column-"]').first().locator(newCardSelector)).toBeVisible();
  192 |     // Verify basic info on card
  193 |     await expect(page.locator(newCardSelector).locator(`text=${newDealData.company}`)).toBeVisible();
  194 |     // await expect(page.locator(newCardSelector).locator(`text=£${newDealData.amount}`)).toBeVisible(); // Check formatting
  195 |
  196 |     // --- 5. (Optional) Verify All Fields Saved Correctly ---
  197 |     await page.locator(newCardSelector).click();
  198 |     await expect(page.locator(modalSelector)).toBeVisible();
  199 |     await expect(page.locator(modalSelector).locator('input#dealName')).toHaveValue(newDealData.name);
  200 |     await expect(page.locator(modalSelector).locator('input#company')).toHaveValue(newDealData.company);
  201 |     await expect(page.locator(modalSelector).locator('input#contactName')).toHaveValue(newDealData.contactName);
  202 |     await expect(page.locator(modalSelector).locator('input#amount')).toHaveValue(newDealData.amount);
  203 |     await expect(page.locator(modalSelector).locator('input#closeDate')).toHaveValue(newDealData.closeDate);
  204 |     await expect(page.locator(modalSelector).locator('textarea#notes')).toHaveValue(newDealData.notes);
  205 |     await expect(page.locator(modalSelector).locator('input#probability')).toHaveValue(newDealData.probability);
  206 |     await expect(page.locator(modalSelector).locator('select#priority')).toHaveValue(newDealData.priority);
  207 |     await expect(page.locator(modalSelector).locator('select#dealSize')).toHaveValue(newDealData.dealSize);
  208 |     await expect(page.locator(modalSelector).locator('input#nextAction')).toHaveValue(newDealData.nextAction);
  209 |     await expect(page.locator(modalSelector).locator(`button[aria-label*="${newDealData.leadSourceType}"][aria-pressed="true"]`)).toBeVisible();
  210 |     await expect(page.locator(modalSelector).locator(`[data-testid="channel-option-${newDealData.leadSourceChannel}"][aria-selected="true"]`)).toBeVisible(); // Assuming aria-selected
  211 |
  212 |     // Close modal
  213 |     await page.locator(modalSelector).locator('button[aria-label="Close modal"]').click();
  214 |     await expect(page.locator(modalSelector)).not.toBeVisible();
  215 |
```