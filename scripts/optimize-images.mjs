/**
 * Otimização de imagens da marca Wazoo Pet Express.
 *
 * Lê os PNGs originais (pesados) de ./assets-src e gera versões .webp
 * leves e prontas para a web em ./public/images.
 *
 * Uso:  npm run optimize:images
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets-src");
const OUT = path.join(ROOT, "public", "images");

fs.mkdirSync(OUT, { recursive: true });

/** Lista de conversões: [origem relativa, destino, largura máx, qualidade] */
const jobs = [
  // Logo (mantém transparência)
  ["LOGO/logo_wazoo_no_white.png", "logo-wazoo.webp", 560, 92],
  ["logo_wazoo_no_paw_white.png", "logo-wazoo-white.webp", 560, 92],

  // Mascotes (transparência)
  ["MASCOTES/mascote_saudacao.png", "mascote-saudacao.webp", 580, 88],
  ["MASCOTES/mascote_trabalhando.png", "mascote-trabalhando.webp", 580, 88],
  ["MASCOTES/mascote_dormindo.png", "mascote-dormindo.webp", 580, 88],
  ["MASCOTES/mascote_brincando.png", "mascote-brincando.webp", 580, 88],
  ["MASCOTES/cachorro_banho.png", "cachorro-banho.webp", 580, 88],
  ["MASCOTES/cachorro_comendo.png", "cachorro-comendo.webp", 580, 88],
  ["MASCOTES/cachorro_correndo.png", "cachorro-correndo.webp", 580, 88],
  ["MASCOTES/cachorro_trabalhando.png", "cachorro-trabalhando.webp", 580, 88],

  // Produtos (fotos)
  ["PRODUTOS/brinquedo_wazoo.png", "produto-brinquedo.webp", 900, 82],
  ["PRODUTOS/caixa_transporte_wazoo.png", "produto-caixa-transporte.webp", 900, 82],
  ["PRODUTOS/cama_wazoo.png", "produto-cama.webp", 900, 82],
  ["PRODUTOS/coleira_wazoo.png", "produto-coleira.webp", 900, 82],
  ["PRODUTOS/petiscos_wazoo.png", "produto-petiscos.webp", 900, 82],
  ["PRODUTOS/racao_wazoo.png", "produto-racao.webp", 900, 82],
  ["PRODUTOS/shampoo_wazoo.png", "produto-shampoo.webp", 900, 82],
  ["PRODUTOS/tigelas_wazoo.png", "produto-tigelas.webp", 900, 82],

  // Modelos / publicidade (fotos para banners)
  ["MODELOS/modelo_crianca_beagle.png", "modelo-crianca-beagle.webp", 1400, 80],
  ["MODELOS/modelo_homem_golden.png", "modelo-homem-golden.webp", 1400, 80],
  ["MODELOS/modelo_mulher_poodle.png", "modelo-mulher-poodle.webp", 1400, 80],
  ["MODELOS/publicidade_bulldogs.png", "ad-bulldogs.webp", 1500, 80],
  ["MODELOS/publicidade_risada.png", "ad-risada.webp", 1400, 80],
  ["MODELOS/publicidade_surpresa.png", "ad-surpresa.webp", 1400, 80],
  ["MODELOS/publicidade_ternura.png", "ad-ternura.webp", 1400, 80],
];

function kb(bytes) {
  return (bytes / 1024).toFixed(0) + " KB";
}

let before = 0;
let after = 0;

const run = async () => {
  for (const [rel, outName, width, quality] of jobs) {
    const inPath = path.join(SRC, rel);
    const outPath = path.join(OUT, outName);
    if (!fs.existsSync(inPath)) {
      console.warn("⚠️  ausente:", rel);
      continue;
    }
    const srcSize = fs.statSync(inPath).size;
    await sharp(inPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toFile(outPath);
    const outSize = fs.statSync(outPath).size;
    before += srcSize;
    after += outSize;
    console.log(`✓ ${outName.padEnd(28)} ${kb(srcSize).padStart(9)} → ${kb(outSize).padStart(8)}`);
  }

  // Favicon a partir do logo colorido
  const favSrc = path.join(SRC, "LOGO/logo_wazoo_no_white.png");
  if (fs.existsSync(favSrc)) {
    await sharp(favSrc)
      .resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(OUT, "logo-icon.png"));
    console.log("✓ logo-icon.png (favicon)");
  }

  console.log(
    `\n📦 Total: ${kb(before)} → ${kb(after)}  (economia de ${(100 - (after / before) * 100).toFixed(0)}%)`
  );
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
