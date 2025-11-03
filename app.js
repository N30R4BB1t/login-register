const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const https = require('https');  // ADICIONAR
const http = require('http');    // ADICIONAR
const fs = require('fs');        // ADICIONAR

// Carregar variáveis de ambiente
dotenv.config();

// Importar rotas
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Importar middlewares
const errorMiddleware = require('./middlewares/errorMiddleware');

// Inicializar Express
const app = express();

// ========================================
// MIDDLEWARES GLOBAIS
// ========================================

// Helmet com CSP seguro
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    // HSTS - Force HTTPS (apenas se usar HTTPS)
    strictTransportSecurity: process.env.USE_HTTPS === 'true' ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false
  })
);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:443',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Log de requisições (desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ========================================
// ROTAS
// ========================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// ========================================
// MIDDLEWARE DE ERRO
// ========================================

app.use(errorMiddleware);

// ========================================
// INICIAR SERVIDOR (HTTP ou HTTPS)
// ========================================

const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

if (USE_HTTPS) {
  // ========================================
  // SERVIDOR HTTPS
  // ========================================
  
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
    };

    const httpsServer = https.createServer(httpsOptions, app);

    httpsServer.listen(PORT, () => {
      console.log(`
    ========================================
    🔒 Servidor HTTPS rodando!
    📍 Ambiente: ${process.env.NODE_ENV || 'development'}
    🌐 URL: https://localhost:${PORT}
    ⚠️  Certificado auto-assinado (dev)
    ========================================
      `);
    });

    // Opcional: Redirecionar HTTP para HTTPS
    //const httpPort = 80;
    //http.createServer((req, res) => {
    //  res.writeHead(301, { "Location": `https://localhost:${PORT}${req.url}` });
    //  res.end();
    //}).listen(httpPort, () => {
    //  console.log(`🔀 HTTP (${httpPort}) → HTTPS (${PORT})`);
    //});

  } catch (error) {
    console.error('❌ Erro ao carregar certificados SSL:', error.message);
    console.log('💡 Execute: openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes');
    process.exit(1);
  }

} else {
  // ========================================
  // SERVIDOR HTTPS (padrão)
  // ========================================
  
  app.listen(PORT, () => {
    console.log(`
    ========================================
    🚀 Servidor HTTPS rodando!
    📍 Ambiente: ${process.env.NODE_ENV || 'development'}
    🌐 URL: http://localhost:${PORT}
    ========================================
    `);
  });
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado:', err);
  process.exit(1);
});

