# Launch checklist — minutemenmarketing.com

Plain-English steps for Noah. Do them in order. Each step says what to paste back to Claude (or where
to put it yourself). Written 2026-11-05.

**Status 2026-11-07:** the site is live on https://minutemenmarketing.com (Steps 1 and 2 done; Step 5
checked except the items marked YOU). Background as checked on 2026-11-05:

- **Registrar: GoDaddy** (GoDaddy.com, LLC). Registered 2026-08-19, paid through **2029-08-19**.
- **DNS is also at GoDaddy** (nameservers `ns63.domaincontrol.com` and `ns64.domaincontrol.com`).
- Right now the domain shows a **GoDaddy-hosted page** (GoDaddy's site builder), not our site.
- The domain has **no email set up** (no MX records).
- The new site lives in the Vercel project **minutemen-marketing** (team "Noah-Ethan's projects") and is
  live at https://minutemen-marketing.vercel.app.

---

## Step 1 — Get the Web3Forms key (5 minutes) — DONE 2026-11-07

The contact form is built but hidden until it has a key. Web3Forms is free and sends each form
submission to your email.

1. Go to **https://web3forms.com**.
2. In the box on the home page, type the inbox that should receive inquiries:
   **minutemenmrktng@gmail.com** (or hello@minutemenmarketing.com once Step 3 is done), then click
   **Create Access Key**.
3. Open that inbox. Web3Forms emails you an **Access Key** (a long code like
   `a1b2c3d4-e5f6-...`).
4. **Paste back to Claude:** "Web3Forms key: <the key>".
   (Or do it yourself: open `src/site-config.js`, put the key between the quotes on the
   `web3formsKey: ''` line, save, commit, push.)

The key is safe to have in the website's code; Web3Forms designs it to be public. It only lets
people send messages to the inbox you chose.

After the key is in: Claude redeploys, the form appears on /contact, and you send one test message
(Step 5).

---

## Step 2 — Point minutemenmarketing.com at Vercel (GoDaddy, about 15 minutes + waiting) — DONE (seen 2026-11-07)

### 2a. Add the domain in Vercel

1. Go to **https://vercel.com** → open the **minutemen-marketing** project → **Settings** → **Domains**.
2. Click **Add Domain**, type **minutemenmarketing.com**, click **Add**.
3. When Vercel asks, choose the option that **adds www.minutemenmarketing.com too and redirects www to
   minutemenmarketing.com** (the site's main address is the one without www).
4. Vercel now shows the DNS records it wants, marked "Invalid Configuration" until GoDaddy is updated.
   Usually:
   - for `minutemenmarketing.com`: an **A record** with the value **76.76.21.21**
   - for `www`: a **CNAME record** with the value **cname.vercel-dns.com**

   **If Vercel shows different values, use exactly what Vercel shows.** Keep this tab open.

### 2b. Turn off the GoDaddy site (so it stops grabbing the domain)

1. Go to **https://www.godaddy.com** → sign in → **My Products**.
2. If you see a **Website Builder / Websites + Marketing** site connected to minutemenmarketing.com,
   open it → **Settings** → **disconnect the domain** (or delete the site if you don't need it).
   If you skip this, GoDaddy can quietly put its own records back.
3. Also check **My Products → Domains → minutemenmarketing.com → Forwarding** (sometimes shown as
   "Domain forwarding"). If forwarding is on, **remove it**.

### 2c. Change the DNS records at GoDaddy

1. **My Products** → next to **minutemenmarketing.com** click **DNS** (or **Manage DNS**).
2. In the **DNS Records** list:
   - Find the **A** record with **Name `@`**. Click the pencil (Edit) → change **Value** to
     **76.76.21.21** (or Vercel's value) → **TTL 600 seconds** (or "Custom 600") → **Save**.
     If there is more than one A record for `@`, **delete the extras** so only Vercel's remains.
   - Find the **CNAME** record with **Name `www`**. Edit → **Value: cname.vercel-dns.com** (or
     Vercel's value) → **Save**. If there's no `www` CNAME, click **Add New Record** → Type **CNAME**,
     Name **www**, Value **cname.vercel-dns.com**, TTL 1 hour → **Save**.
   - Leave **NS** and **SOA** records alone. Don't touch anything you're not sure about.
3. Back in Vercel → **Domains**, wait until both domains show **Valid Configuration** with a green
   check. This often takes 5–30 minutes, occasionally a few hours. Vercel issues the HTTPS
   certificate on its own.

**Paste back to Claude:** "Domain is connected." Claude then checks the live domain. Nothing else
needs changing for search: the "noindex" header only applies to `*.vercel.app` addresses, so Google
can index minutemenmarketing.com as soon as it's connected.

---

## Step 3 — Free email forwarding for hello@minutemenmarketing.com (10 minutes)

This makes mail sent to **hello@minutemenmarketing.com** arrive in **minutemenmrktng@gmail.com**.
Recommended free service: **ImprovMX** (free plan forwards a domain to one inbox, no mailbox to
manage).

1. Go to **https://improvmx.com**. Type **minutemenmarketing.com** and your Gmail
   **minutemenmrktng@gmail.com**, then sign up.
2. ImprovMX creates a catch-all forward. Add an alias **hello** → **minutemenmrktng@gmail.com** if it
   isn't there already.
3. ImprovMX shows the DNS records to add. At GoDaddy (**My Products → DNS** for the domain), click
   **Add New Record** for each:
   - **MX**, Name **@**, Value **mx1.improvmx.com**, Priority **10**
   - **MX**, Name **@**, Value **mx2.improvmx.com**, Priority **20**
   - **TXT**, Name **@**, Value **v=spf1 include:spf.improvmx.com ~all**

   **Use exactly what ImprovMX shows if it differs.** If GoDaddy already has MX records (it shouldn't
   today), delete them first.
4. Back in ImprovMX, click **Check again** until it says the records are found (minutes to an hour).
5. Test: from a different email account, send a message to **hello@minutemenmarketing.com**. It should
   arrive in the Gmail inbox. Check Spam the first time.
6. Optional — reply *as* hello@: in Gmail → **Settings → Accounts → Send mail as → Add another
   address**. ImprovMX's free plan doesn't include sending, so either use Gmail's own SMTP option
   ImprovMX explains, or keep replying from the Gmail address.

**Paste back to Claude (optional):** "Use hello@minutemenmarketing.com as the site email." Claude
then switches the email shown on the site (`workEmail` in `src/site-config.js`) and, if you want,
re-creates the Web3Forms key for that inbox.

---

## Step 4 — Ask the two clients for a testimonial and permission

Send these as texts. Paste their replies back to Claude ("Testimonial from Nilou: …") and Claude
adds them to the carousel with the names they approve. Nothing goes on the site without their OK.

**To Nilou (Smiles by Nilou):**

> Hi Nilou, it's Noah from Minutemen Marketing. We're launching our new website, and I'd like to show
> smilesbynilou.com on the portfolio page. Is that OK with you? Could you send me one or two sentences
> about working with us? I'd post them with your first name and Smiles by Nilou. Thank you!

**To Beauty & Wellness addict (Dr. Sheila Omrani and Nurse Lisa Farazmand):**

> Hi Sheila and Lisa, it's Noah from Minutemen Marketing. We're launching our new website, and I'd
> like to show beautyandwellnessny.com on the portfolio page. Are you both OK with that? Could you send
> me one or two sentences about working with us? I'd post them with your names and Beauty & Wellness
> addict. Thank you!

(Both texts were checked with stop-slop. Swap "Sheila" for "Dr. Omrani" if that's how you address
her.)

If either says no to being featured, tell Claude and their site comes off the Home carousel and the
Portfolio page the same day.

---

## Step 5 — Final checks after launch

**Checked by Claude on 2026-11-07 (live domain):**

| # | Check | Result |
|---|---|---|
| 1 | HTTPS, www and http redirects | ✅ HTTPS with HSTS; `www` → 308 → minutemenmarketing.com; `http://` → 308 → `https://` |
| 1 | Hero plays and scrolls | ✅ Chromium, Edge, WebKit (Safari engine), iPhone 14 and Galaxy S9+ emulation: story plays, all three lines appear, nav fades in the hero and comes back |
| 1 | Phone edge-to-edge (address bar shown/hidden) | ✅ 27/27 at 375, 390 and 430px, start/middle/end of the hero, no scroll jumps; chips clear of the home bar |
| 2 | Pages load directly | ✅ /, /about, /portfolio, /contact return 200; unknown pages return a real 404 with the branded page |
| 3 | Contact form | ✅ One real test sent 2026-11-07 13:59 ET from the live page: Web3Forms answered "success", the page showed the thank-you message. Success, error and validation states also pass in every browser above (intercepted, nothing sent) |
| 4 | Phone and email links | ✅ `tel:+16318828022` and `mailto:minutemenmrktng@gmail.com` on every page |
| 5 | Portfolio windows | ✅ Both client sites load **live** and scroll inside their windows (Smiles shows its live site on this domain) in every browser above |
| 6 | Reduce motion | ✅ Tap → still version, button reads "Play animation"; tap again → the story returns |
| 8 | Share card tags | ✅ og/twitter tags on every page; `og.jpg` (1200×630) serves 200 to LinkedIn's crawler |
| 9 | Analytics | ✅ Web Analytics and Speed Insights scripts 200; page views accepted (`POST /_vercel/insights/view` → 200) |
| — | Sitemap and robots | ✅ `/sitemap.xml` lists the four pages on minutemenmarketing.com; `/robots.txt` allows all and points to it |

**Left for you (needs your phone or your logins):**

**YOU 1 — Real phones (5 minutes).** On an iPhone (Safari) and, if you can, an Android (Chrome):
scroll slowly through the whole hero and back up so the address bar hides and reappears. The picture
should reach the bottom of the screen with no light strip, and the scroll should feel smooth. (WebKit
on Windows can't show real Safari smoothness: it draws the hero's colour grade in software. If an
iPhone stutters in the hero, tell Claude: the fix is to drop or bake in that grade for Safari.)
Also tap the phone number (it should offer to call) and the email address (it should open a new
email).

**YOU 2 — Check the test email arrived.** In minutemenmrktng@gmail.com, look for **"Consultation
request from Site test (Minutemen Marketing (test))"**, sent 2026-11-07 at 1:59 PM ET from
"Minutemen Marketing website". If it isn't in the inbox, check **Spam** and **Promotions**, and mark it
"Not spam" so future inquiries land in the inbox.

**YOU 3 — Google Search Console + sitemap (10 minutes + waiting).**
1. Go to **https://search.google.com/search-console** and sign in with the Google account that should
   own the site (e.g. minutemenmrktng@gmail.com).
2. If this is your first property you'll see **"Select property type"** right away. Otherwise click the
   property menu at the top left → **+ Add property**.
3. In the left box, **Domain**, type `minutemenmarketing.com` (no https, no www) → **Continue**.
4. A box opens: **"Verify domain ownership via DNS record"**.
   - If it shows a **"Start verification"** button for GoDaddy: click it, sign in to GoDaddy, click
     **Connect / Authorize**, and you're done; skip to step 7.
   - Otherwise: leave **Record type: TXT**, click **Copy** next to the
     `google-site-verification=…` value. Keep this tab open.
5. In a new tab: **https://www.godaddy.com** → sign in → **My Products** → next to
   **minutemenmarketing.com** click **DNS** → **Add New Record** → **Type: TXT**, **Name: `@`**,
   **Value:** paste the copied text, **TTL:** 1 hour → **Save**. Don't change the existing A and
   CNAME records (they point the site at Vercel).
6. Back in Search Console → **Verify**. If it says the record wasn't found, wait 10 minutes and
   click **Verify** again (it can take up to a few hours).
7. When it says **"Ownership verified"** → **Go to property**.
8. Left menu → **Indexing** → **Sitemaps**. Under **"Add a new sitemap"** the box already starts with
   `https://minutemenmarketing.com/`: type `sitemap.xml` → **Submit**. The row should show
   **Status: Success** and **4** discovered pages. ("Couldn't fetch" in the first minutes is normal:
   refresh later.)
9. Optional, speeds things up: in the search bar at the top (**"Inspect any URL in
   minutemenmarketing.com"**) paste `https://minutemenmarketing.com/` → Enter → **Request indexing**.
   Repeat for `/about`, `/portfolio` and `/contact`.

**YOU 4 — LinkedIn Post Inspector (2 minutes).**
1. Go to **https://www.linkedin.com/post-inspector/** and sign in to LinkedIn.
2. Paste `https://minutemenmarketing.com/` into the box → **Inspect**.
3. Check the preview card: the Minutemen logo image, the title "Minutemen Marketing | Websites, SEO
   and AI Search for Long Island Businesses", and minutemenmarketing.com. **Last scraped** now reads
   "a few seconds ago": that also refreshes LinkedIn's cached copy.
4. Repeat for `https://minutemenmarketing.com/about`, `/portfolio` and `/contact` (each has its own
   title).
5. If the image is missing, click **Inspect** again after a minute. If it's still missing, send Claude
   a screenshot of the **Properties** section.

**YOU 5 — Share previews in messages.** Text the link to yourself in iMessage and send it in an
Instagram DM: both should show the logo card.

**YOU 6 — Vercel Analytics.** Vercel → **minutemen-marketing** → **Analytics**: visits to
minutemenmarketing.com should appear (it ignores bots, so open the site on your phone first).

When those work, the launch checklist is complete.
