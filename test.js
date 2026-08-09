const https = require('https');
https.get('https://sakuranovel.id/wp-content/uploads/2023/02/A-Reincarnation-Romantic-Comedy-Of-A-Hero-And-A-Witch.jpg', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Referer': 'https://sakuranovel.id/'
  }
}, (res) => {
  console.log(res.statusCode);
});
