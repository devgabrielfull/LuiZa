import 'dotenv/config';
import app from './app.js';

const PORT = Number(process.env.PORT || 3333);

// O servidor é usado apenas neste computador.
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ LuiZa disponível em http://127.0.0.1:${PORT}`);
});
