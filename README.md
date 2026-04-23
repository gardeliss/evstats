# EV Stats Greece - Ταξινομήσεις Ηλεκτρικών Αυτοκινήτων

Web application για την προβολή συγκεντρωτικών δεδομένων ταξινομήσεων ηλεκτρικών αυτοκινήτων στην Ελλάδα από το [evstats.gr](https://evstats.gr).

## Χαρακτηριστικά

- 📊 Συγκεντρωτική προβολή όλων των ημερών του τρέχοντος μήνα
- 🚗 Κατάταξη μοντέλων με αριθμό ταξινομήσεων
- 📈 Οπτική αναπαράσταση με bar charts
- 🔄 Ταξινόμηση ανά αριθμό ή αλφαβητικά
- 📱 Responsive design για mobile και desktop
- ⚡ Γρήγορη φόρτωση με παράλληλες κλήσεις API

## Εγκατάσταση στο GitHub Pages

### Βήμα 1: Δημιουργία Repository

1. Πήγαινε στο GitHub και δημιούργησε ένα νέο repository
2. Ονόμασέ το (π.χ. `evstats-viewer`)
3. Κάνε το public

### Βήμα 2: Upload Αρχείων

Upload τα παρακάτω αρχεία στο repository:
- `index.html`
- `styles.css`
- `app.js`
- `README.md` (προαιρετικά)

### Βήμα 3: Ενεργοποίηση GitHub Pages

1. Πήγαινε στο **Settings** του repository
2. Στο αριστερό μενού, πάτα **Pages**
3. Στο **Source**, επέλεξε **Deploy from a branch**
4. Στο **Branch**, επέλεξε **main** και folder **/ (root)**
5. Πάτα **Save**

### Βήμα 4: Πρόσβαση

Μετά από λίγα λεπτά, το site θα είναι διαθέσιμο στο:
```
https://<username>.github.io/<repository-name>/
```

## Δομή Αρχείων

```
.
├── index.html          # Κύρια σελίδα HTML
├── styles.css          # Styles και animations
├── app.js             # JavaScript logic και API calls
└── README.md          # Αυτό το αρχείο
```

## Πώς Λειτουργεί

1. Κατά την φόρτωση, η εφαρμογή καθορίζει τον τρέχοντα μήνα
2. Κάνει παράλληλες κλήσεις στο API του evstats.gr για κάθε ημέρα του μήνα
3. Συγκεντρώνει τα δεδομένα από όλες τις ημέρες
4. Εμφανίζει τα μοντέλα ταξινομημένα με τον συνολικό αριθμό ταξινομήσεων

## API που Χρησιμοποιείται

```
https://evstats.gr/api/dailyBevModels/{YYYY-MM-DD}
```

Παράδειγμα response:
```json
{
  "cars": {
    "models": {
      "TOYOTA C-HR": 4,
      "BYD ATTO 3": 4,
      "RENAULT 5 E-TECH": 3
    },
    "total": 29
  }
}
```

## Τεχνολογίες

- **HTML5** - Δομή σελίδας
- **CSS3** - Styling με animations και transitions
- **Vanilla JavaScript** - Λογική εφαρμογής (no frameworks)
- **Fetch API** - Για κλήσεις στο evstats.gr API

## Χαρακτηριστικά Design

- 🎨 Dark theme με σύγχρονο minimalist design
- ✨ Animations και transitions για καλύτερη UX
- 📊 Bar charts για οπτική αναπαράσταση
- 🎯 Typography: DM Serif Display, Manrope, IBM Plex Mono
- 🌟 Grain overlay effect για texture
- ⚡ Glow effects και smooth transitions

## Τοπική Ανάπτυξη

Για να τρέξεις το project τοπικά:

```bash
# Χρησιμοποίησε έναν απλό HTTP server
python -m http.server 8000

# Ή με Node.js
npx serve

# Ή με PHP
php -S localhost:8000
```

Στη συνέχεια άνοιξε το browser στο `http://localhost:8000`

## Σημειώσεις

- Τα δεδομένα ανανεώνονται κάθε φορά που φορτώνεις τη σελίδα
- Εμφανίζονται μόνο οι ημέρες του τρέχοντος μήνα με διαθέσιμα δεδομένα
- Το API του evstats.gr μπορεί να μην έχει δεδομένα για όλες τις ημέρες
- Η εφαρμογή είναι fully client-side (no backend required)

## Credits

Δεδομένα από [evstats.gr](https://evstats.gr)

## License

MIT License - Free to use and modify
