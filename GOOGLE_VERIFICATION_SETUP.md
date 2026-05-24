# Google Search Console & Analytics Setup Guide

Your MedRise Medical Centre website is now configured for Google verification and analytics tracking.

## Live Website URL
**https://medrise-medical-centre-1--medrisemedical1.replit.app**

---

## ✅ What's Been Set Up

### 1. **Google Analytics Tracking** (Ready to activate)
- Analytics script is embedded in `src/main.tsx`
- Loads Google Analytics (GA4) on every page
- Tracks page views automatically

### 2. **Sitemap** 
- Created `public/sitemap.xml` with 6 key pages
- Public, About, Services, Appointments, Contact, Feedback
- Automatically served at `/sitemap.xml`

### 3. **Robots.txt**
- Updated with sitemap reference
- Blocks crawling of protected routes (/admin, /patient, /staff)
- Allows public content indexing

### 4. **Meta Tags**
- Google Search Console verification tag (placeholder added to `index.html`)
- Open Graph tags for social sharing
- Twitter Card meta tags

---

## 🔧 Step 1: Setup Google Analytics (GA4)

### Create a Google Analytics Property

1. **Go to Google Analytics**: https://analytics.google.com/
2. **Sign in** with your Google account (create one if needed)
3. **Click "Start measuring"** or go to Admin → Create Property
4. **Enter property details:**
   - Property name: `MedRise Medical Centre`
   - Reporting time zone: Your timezone
   - Currency: USD (or your currency)
   - Industry: Healthcare
5. **Click Create**
6. **Accept the terms** and proceed
7. **Select "Web"** as your platform
8. **Enter your website URL**: `https://medrise-medical-centre-1--medrisemedical1.replit.app`
9. **Click "Create Stream"**
10. **Copy the Measurement ID** (format: `G-XXXXXXXXXX`)

### Add GA ID to Your Environment

1. Open `artifacts/medrise/.env` file
2. Add your measurement ID:
   ```
   VITE_GA_ID=G-XXXXXXXXXX
   ```
   (Replace `G-XXXXXXXXXX` with your actual ID from step 10)

3. **Rebuild and redeploy** the frontend:
   ```bash
   pnpm --filter @workspace/medrise build
   ```

4. Your analytics tracking is now active! 📊
   - Visit your website: https://medrise-medical-centre-1--medrisemedical1.replit.app
   - Go to Google Analytics → Real-time → Overview
   - You should see your session appear within seconds

---

## 🔐 Step 2: Setup Google Search Console

### Verify Your Website

1. **Go to Google Search Console**: https://search.google.com/search-console
2. **Click "URL prefix"** and enter:
   ```
   https://medrise-medical-centre-1--medrisemedical1.replit.app
   ```
3. **Click Continue**
4. **Choose verification method**: Select "Meta tag" or "HTML file"

### Option A: Meta Tag Verification (Recommended)

1. Google will show you a meta tag like:
   ```html
   <meta name="google-site-verification" content="ABC123XYZ..." />
   ```

2. **Copy the `content` value** (e.g., `ABC123XYZ...`)

3. **Update your index.html**:
   - Open: `artifacts/medrise/index.html`
   - Find the line: `<meta name="google-site-verification" content="" />`
   - Paste your verification code:
     ```html
     <meta name="google-site-verification" content="ABC123XYZ..." />
     ```

4. **Rebuild and redeploy**:
   ```bash
   pnpm --filter @workspace/medrise build
   # The build output goes to dist/public/
   # It will auto-deploy to Replit
   ```

5. **Back in Google Search Console**, click **"Verify"**
6. ✅ You should see: "Ownership verified"

### Option B: Domain Name Server (DNS) Verification

If DNS verification is easier for your setup:
1. Google provides a TXT record
2. Add it to your domain's DNS settings
3. Same verification process in Google Search Console

---

## 📝 Step 3: Submit Your Sitemap

### In Google Search Console

1. **Go to**: Sitemaps (left sidebar)
2. **Enter sitemap URL**:
   ```
   https://medrise-medical-centre-1--medrisemedical1.replit.app/sitemap.xml
   ```
3. **Click "Submit"**
4. Google will index your pages within hours to days

---

## 🎯 Step 4: Verify Analytics Connection (Optional)

In Google Analytics:

1. **Admin** → **Data Streams** → **Web**
2. **Click your website**
3. **Scroll down** → **Enhanced measurement**
4. **Enable:**
   - Page views
   - Scrolls
   - Outbound clicks
   - Site search
   - Video engagement

---

## 📊 Expected Results

After setup:
- ✅ Google shows your website in search results within 2-7 days
- ✅ Real-time analytics appear instantly
- ✅ Daily active user tracking
- ✅ Page performance metrics
- ✅ Traffic sources identified (organic, direct, referral)
- ✅ User behavior insights

---

## 🚀 Next Steps

1. **Add VITE_GA_ID to `.env`** and redeploy
2. **Update meta verification tag** in `index.html` and redeploy
3. **Visit Google Search Console** and verify ownership
4. **Submit your sitemap**
5. **Monitor in Google Analytics dashboard**

---

## 📞 Troubleshooting

**Analytics not showing data?**
- Check browser console (F12) for errors
- Verify `VITE_GA_ID` is correctly set
- Allow 24 hours for initial data collection
- Check Real-time view first

**Search Console verification failing?**
- Ensure meta tag is exactly correct (spaces matter!)
- Rebuild and redeploy after changes
- Wait 2-3 minutes for changes to propagate
- Try DNS verification as alternative

**Sitemap not indexing?**
- Check sitemap is accessible at `/sitemap.xml`
- Ensure URLs in sitemap are publicly accessible
- Submit directly in Google Search Console

---

## 📋 Verification Checklist

- [ ] GA4 property created at google.com/analytics
- [ ] `VITE_GA_ID` added to `.env`
- [ ] Frontend rebuilt and deployed
- [ ] Google Analytics tracking code loaded (check F12 Network tab)
- [ ] Google Search Console property created
- [ ] Meta verification tag added to `index.html`
- [ ] Frontend rebuilt and deployed
- [ ] Website verified in Google Search Console
- [ ] Sitemap submitted to Google Search Console
- [ ] Real-time analytics showing traffic

---

## 🔗 Useful Links

- **Google Analytics**: https://analytics.google.com/
- **Google Search Console**: https://search.google.com/search-console/
- **Verify ownership**: https://search.google.com/u/1/search-console/welcome
- **Analytics documentation**: https://support.google.com/analytics
- **Search Console help**: https://support.google.com/webmasters

---

Good luck! Your website is ready for Google indexing and analytics! 🎉
