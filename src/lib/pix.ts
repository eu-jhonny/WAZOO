/**
 * Geração de "PIX Copia e Cola" (BR Code / payload EMV) 100% no cliente,
 * sem depender de gateway externo. O resultado é uma string que pode ser
 * exibida e transformada em QR Code.
 *
 * Referência: Manual de Padrões para Iniciação do Pix (Banco Central).
 */

/** Monta um campo TLV (id + tamanho com 2 dígitos + valor). */
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** Remove acentos, força ASCII e maiúsculas, limita o tamanho. */
function sanitize(text: string, max: number): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, max);
}

/** TXID: apenas alfanumérico, no máx. 25 caracteres. */
function sanitizeTxid(text: string): string {
  const clean = text.replace(/[^A-Za-z0-9]/g, "").slice(0, 25);
  return clean || "***";
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF). */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface PixPayloadInput {
  /** Chave PIX (CPF/CNPJ, e-mail, telefone +55... ou aleatória). */
  key: string;
  /** Nome do recebedor (máx. 25 caracteres no payload). */
  merchantName: string;
  /** Cidade do recebedor (máx. 15 caracteres no payload). */
  merchantCity?: string;
  /** Valor da transação em reais (ex.: 85.4). 0/undefined = sem valor fixo. */
  amount?: number;
  /** Identificador da transação (ex.: número do pedido). */
  txid?: string;
  /** Descrição opcional. */
  description?: string;
}

/**
 * Constrói o BR Code estático ("Pix Copia e Cola").
 * Retorna a string completa pronta para virar QR Code.
 */
export function buildPixPayload({
  key,
  merchantName,
  merchantCity = "SAO PAULO",
  amount,
  txid,
  description,
}: PixPayloadInput): string {
  // Merchant Account Information (tag 26) — GUI + chave (+ descrição)
  let mai = tlv("00", "br.gov.bcb.pix") + tlv("01", key.trim());
  if (description) mai += tlv("02", sanitize(description, 40));

  const fields: string[] = [
    tlv("00", "01"),               // Payload Format Indicator
    tlv("26", mai),                // Merchant Account Information (PIX)
    tlv("52", "0000"),             // Merchant Category Code
    tlv("53", "986"),              // Moeda = BRL
  ];

  if (amount && amount > 0) {
    fields.push(tlv("54", amount.toFixed(2)));
  }

  fields.push(
    tlv("58", "BR"),                                  // País
    tlv("59", sanitize(merchantName, 25) || "WAZOO"), // Nome do recebedor
    tlv("60", sanitize(merchantCity, 15) || "SAO PAULO"), // Cidade
    tlv("62", tlv("05", sanitizeTxid(txid ?? "***"))),    // Additional data (txid)
  );

  const partial = fields.join("") + "6304"; // tag 63 + len 04, antes do CRC
  return partial + crc16(partial);
}
