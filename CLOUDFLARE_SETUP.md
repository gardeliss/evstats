# Οδηγίες για Cloudflare Worker (ΔΩΡΕΑΝ λύση CORS)

## Γιατί χρειάζεται;

Το evstats.gr API δεν επιτρέπει requests από άλλα domains (CORS policy). Τα δημόσια CORS proxies (allOrigins, corsproxy.io) συχνά πέφτουν ή έχουν rate limits.

**Η λύση:** Ένα δικό σου micro-backend που:
- Είναι ΔΩΡΕΑΝ (50,000 requests/day)
- Πιο γρήγορο από proxies
- Αξιόπιστο 99.9% uptime
- Παίρνει 5 λεπτά να στηθεί

## Βήματα Εγκατάστασης

### 1. Δημιούργησε λογαριασμό Cloudflare

1. Πήγαινε στο https://workers.cloudflare.com
2. Κάνε sign up (δωρεάν)
3. Verify το email σου

### 2. Δημιούργησε Worker

1. Πάτα **"Create a Worker"**
2. Θα δεις ένα editor με sample κώδικα
3. **Διέγραψε όλο τον κώδικα**
4. Αντίγραψε-κόλλησε τον κώδικα από το αρχείο `cloudflare-worker.js`
5. Πάτα **"Save and Deploy"**

### 3. Πάρε το URL

Μετά το deploy, θα δεις κάτι σαν:
```
https://evstats-proxy.your-username.workers.dev
```

Αυτό είναι το URL του Worker σου!

### 4. Ενημέρωσε το app.js

Άνοιξε το `app.js` και άλλαξε:

```javascript
// Βάλε το δικό σου Worker URL εδώ:
const API_BASE_URL = 'https://evstats-proxy.your-username.workers.dev';

// ΜΗΝ χρησιμοποιείς CORS proxy πια
const USE_CORS_PROXY = false;
```

### 5. Upload στο GitHub

Upload το ενημερωμένο `app.js` και έτοιμο! 🎉

## Πώς δουλεύει

**Πριν (με CORS error):**
```
GitHub Pages → evstats.gr API ❌ CORS BLOCK
```

**Τώρα (με Worker):**
```
GitHub Pages → Cloudflare Worker → evstats.gr API ✅
```

Ο Worker κάνει το API call για λογαριασμό σου και επιστρέφει τα δεδομένα με CORS headers!

## Testing

Για να δοκιμάσεις αν δουλεύει:

```
https://evstats-proxy.your-username.workers.dev/2026-04-21
```

Θα πρέπει να δεις το JSON response!

## Troubleshooting

**Πρόβλημα:** 404 error στο Worker
- **Λύση:** Βεβαιώσου ότι το URL έχει την ημερομηνία στο τέλος

**Πρόβλημα:** 500 error
- **Λύση:** Check τα logs στο Cloudflare dashboard

**Πρόβλημα:** Rate limit
- **Λύση:** Το free tier έχει 50k requests/day - αρκετά για εκατοντάδες χρήστες!

## Εναλλακτικές λύσεις (αν δεν θέλεις Cloudflare)

### Λύση 2: Vercel Edge Function (επίσης δωρεάν)
### Λύση 3: Netlify Function
### Λύση 4: Python Flask backend στο PythonAnywhere

Αλλά το Cloudflare Worker είναι το πιο εύκολο και γρήγορο!

## Κόστος

- ✅ **ΔΩΡΕΑΝ** για 50,000 requests/day
- ✅ Αν χρειαστείς περισσότερα: $5/μήνα για 10 εκατομμύρια requests

Για ένα προσωπικό project, το δωρεάν tier είναι υπεραρκετό!
