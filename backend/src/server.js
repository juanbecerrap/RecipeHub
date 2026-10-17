// backend/src/server.js
// Punto de entrada: arranca el servidor HTTP.

import app from './app.js';
import { config } from './config.js';

const server = app.listen(config.port, () => {
  console.log(`API de RecipeHub en http://localhost:${config.port} (${config.env})`);
  if (config.readOnlyDemo) {
    console.log('Modo demostracion: solo lectura');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${config.port} ya esta en uso`);
  } else {
    console.error(error);
  }
  process.exit(1);
});