export async function switchArtist(page,key){
 await page.locator('.site-header nav a[href="./?view=rappers"]').click();
 await page.locator('#rapper-search').waitFor();
 await page.locator(`.dna-rapper-card[href="./?artist=${key}"]`).click();
 await page.locator('.archive-guide').waitFor();
}
