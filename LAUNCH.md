# Launch checklist — minutemenmarketing.com

Plain-English steps for Noah. Do them in order. Each step says what to paste back to Claude (or where
to put it yourself). Written 2026-11-05.

What we know about the domain (checked 2026-11-05):

- **Registrar: GoDaddy** (GoDaddy.com, LLC). Registered 2026-08-19, paid through **2029-08-19**.
- **DNS is also at GoDaddy** (nameservers `ns63.domaincontrol.com` and `ns64.domaincontrol.com`).
- Right now the domain shows a **GoDaddy-hosted page** (GoDaddy's site builder), not our site.
- The domain has **no email set up** (no MX records).
- The new site lives in the Vercel project **minutemen-marketing** (team "Noah-Ethan's projects") and is
  live at https://minutemen-marketing.vercel.app.

---

## Step 1 — Get the Web3Forms key (5 minutes)

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

## Step 2 — Point minutemenmarketing.com at Vercel (GoDaddy, about 15 minutes + waiting)

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

**To Beauty & Wellness addict NY (Dr. Sheila Omrani and Nurse Lisa Farazmand):**

> Hi Sheila and Lisa, it's Noah from Minutemen Marketing. We're launching our new website, and I'd
> like to show beautyandwellnessny.com on the portfolio page. Are you both OK with that? Could you send
> me one or two sentences about working with us? I'd post them with your names and Beauty & Wellness
> addict NY. Thank you!

(Both texts were checked with stop-slop. Swap "Sheila" for "Dr. Omrani" if that's how you address
her.)

If either says no to being featured, tell Claude and their site comes off the Home carousel and the
Portfolio page the same day.

---

## Step 5 — Final checks after launch (15 minutes)

Do these on your phone and your computer once Steps 1–2 are done.

1. **Open https://minutemenmarketing.com** — the padlock shows (HTTPS), the painted hero plays as you
   scroll. Also open **https://www.minutemenmarketing.com** — it should jump to the address without
   www.
   **On your phone (iPhone and, if you can, an Android):** scroll slowly down through the whole hero
   and back up, so the browser's address bar hides and reappears. The picture should always reach
   the very bottom of the screen, with no light strip, and the Skip intro / Reduce motion buttons
   should stay visible above the home bar.
2. **The four pages load directly:** /about, /portfolio, /contact (type them in the address bar).
3. **Contact form test:** on /contact fill in the form with your own details and send. You should see
   "Thanks, … We got your message …" on the page, and the email should arrive in your inbox within a
   minute. If it shows an error instead, tell Claude.
4. **Phone and email links:** tap the phone number on your phone (it should offer to call
   (631) 882-8022) and the email address (it should open a new email).
5. **Portfolio:** both client sites scroll inside their windows. On the real domain Smiles by Nilou now
   shows its live site instead of a screenshot.
6. **Reduce motion:** tap "Reduce motion" at the bottom-left of the hero — the still version appears;
   tap "Play animation" to switch back.
7. **Google:** go to **https://search.google.com/search-console**, add the property
   **minutemenmarketing.com** (choose "Domain", verify with the TXT record it gives you at GoDaddy, the
   same way as Step 3), then **Sitemaps → enter `sitemap.xml` → Submit**.
8. **Share preview:** paste the link in a text to yourself (iMessage) and in an Instagram DM — it
   should show the Minutemen logo card. For LinkedIn, paste the link into
   **https://www.linkedin.com/post-inspector/** and click **Inspect** (this also refreshes LinkedIn's
   cached copy). The card image only works once Step 2 is done, because it's served from
   minutemenmarketing.com.
9. **Analytics:** done (enabled 2026-11-06). Check Vercel → minutemen-marketing → **Analytics** shows visits after launch. (Was: enable it, then tell Claude
   "turn on analytics" (it flips `vercelAnalytics` to `true` in `src/site-config.js`). Speed Insights is
   already on.

When everything above works: tell Claude "Launched" and it will update NEXT-STEPS.md.
