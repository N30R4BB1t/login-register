const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Criar pasta ssl se não existir
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
}

// Gerar certificado usando selfsigned
const selfsigned = require('selfsigned');

const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'BR' },
    { name: 'stateOrProvinceName', value: 'São Paulo' },
    { name: 'localityName', value: 'São Paulo' },
    { name: 'organizationName', value: 'Dev' }
];

const opts = {
    keySize: 4096,
    days: 365,
    algorithm: 'sha256',
    extensions: [
        {
            name: 'subjectAltName',
            altNames: [
                { type: 2, value: 'localhost' },
                { type: 7, ip: '127.0.0.1' }
            ]
        }
    ]
};

console.log('🔐 Gerando certificado SSL auto-assinado...');

const pems = selfsigned.generate(attrs, opts);

// Salvar arquivos
fs.writeFileSync(path.join(sslDir, 'key.pem'), pems.private);
fs.writeFileSync(path.join(sslDir, 'cert.pem'), pems.cert);

console.log('✅ Certificados gerados com sucesso!');
console.log('📁 Localização: ssl/key.pem e ssl/cert.pem');

