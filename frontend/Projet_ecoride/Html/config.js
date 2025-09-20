<script>
  window.API_BASE_URL = (
    location.hostname.endsWith('netlify.app')
      ? 'https://TON-HOTE-API'     // ← remplace par ton URL publique API (ex: https://ecoride-api.onrender.com)
      : 'http://localhost:8080'     // dev local
  );
</script>
