import sys
import time
from playwright.sync_api import sync_playwright

def run():
    print("Starting Playwright Explore verification...", flush=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Login with seeded traveler account
        print("Step 1: Logging in as neon_phase5_traveler@example.com...", flush=True)
        page.goto("http://localhost:5173/user/auth", timeout=15000)
        page.wait_for_load_state("networkidle")

        # Fill login form
        page.fill("input[placeholder='you@example.com']", "neon_phase5_traveler@example.com")
        page.fill("input[placeholder='••••••••']", "password123")
        page.click("button:has-text('Login as Traveler')")
        page.wait_for_timeout(2500)
        print(f"Logged in, current URL: {page.url}", flush=True)

        # 2. Go to /user/explore
        print("Step 2: Navigating to /user/explore...", flush=True)
        page.goto("http://localhost:5173/user/explore", timeout=15000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        print(f"Landed on: {page.url}", flush=True)
        page.wait_for_selector("text=Voyara Discovery Engine", timeout=10000)
        page.wait_for_selector("text=Select Your Experience", timeout=10000)
        page.wait_for_selector("text=Refine Your Search", timeout=10000)
        print("Explore page structure loaded successfully!", flush=True)

        # 3. Test Experience Selector
        print("Step 3: Clicking 'Adventure' experience...", flush=True)
        page.locator("button:has-text('Adventure')").first.click()
        page.wait_for_timeout(1000)

        # Verify chip appears
        chip = page.locator("span:has-text('Adventure')").first
        assert chip.is_visible(), "Adventure chip should be visible"
        print("Adventure experience selected and active chip verified!", flush=True)

        # Clear active filters
        print("Clearing filters before search...", flush=True)
        page.locator("button:has-text('Clear All')").click()
        page.wait_for_timeout(1000)

        # 4. Test Top Search Bar
        print("Step 4: Testing search input for 'Goa'...", flush=True)
        search_input = page.locator("#explore-search-input")
        search_input.fill("Goa")
        page.locator("button:has-text('Search')").first.click()

        # Wait for recommendation cards to finish loading
        print("Waiting for results to load...", flush=True)
        page.wait_for_selector("h3:has-text('Goa')", timeout=15000)

        headings = page.locator("h3").all_inner_texts()
        print(f"Headings found on page: {headings}", flush=True)
        page.screenshot(path="scratch/step4_search_goa.png")

        # Verify Goa result card appears
        assert any("Goa" in h for h in headings), f"Goa should be in headings: {headings}"
        print("Search for 'Goa' successfully returned results!", flush=True)

        # 5. Open Destination Details Modal
        print("Step 5: Testing Quick View / Details Modal...", flush=True)
        page.locator("button:has-text('Details')").first.click()
        page.wait_for_selector("text=About This Destination", timeout=5000)
        page.wait_for_selector("text=Why GoFlexi Recommends This", timeout=5000)
        print("Destination detail modal opened and displays rich metadata!", flush=True)

        # Close Modal
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(500)
        print("Modal closed.", flush=True)

        # 6. Test Clear All
        print("Step 6: Testing Clear All filters...", flush=True)
        if page.locator("button:has-text('Clear All')").is_visible():
            page.locator("button:has-text('Clear All')").click()
            page.wait_for_timeout(1500)
            print("Clear All executed.", flush=True)

        # 7. Take final screenshot
        screenshot_path = "scratch/explore_verification_success.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Verification completed successfully! Screenshot saved to {screenshot_path}", flush=True)

        browser.close()

if __name__ == "__main__":
    run()
