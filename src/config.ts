// Verified on-chain facts. Do not change without re-checking on-chain (see CLAUDE.md §2).
export const CHAIN_ID = 56;
export const CHAIN_ID_HEX = '0x38';
export const TOKEN = '0x252Ce29d2a58B70f98fe80a67773747770Bb0028';
export const VAULT = '0x04d4D102eed59b34A1A6527b48cCa690daEeC8a3';
export const SAFE = '0xc5748294eE8884E7ac0bf27E0978cBA4c81b6d75';
export const RPC = 'https://bsc-dataseed.binance.org';

export const LANGS = ['en', 'tl', 'ja', 'zh', 'ru'] as const;
export type Lang = (typeof LANGS)[number];
/** Value for <html lang> and hreflang. Filipino uses the ISO 639-2 code "fil". */
export const HTML_LANG: Record<Lang, string> = { en: 'en', tl: 'fil', ja: 'ja', zh: 'zh-Hans', ru: 'ru' };
export const OG_LOCALE: Record<Lang, string> = { en: 'en_US', tl: 'fil_PH', ja: 'ja_JP', zh: 'zh_CN', ru: 'ru_RU' };
export const langPath = (l: Lang) => (l === 'en' ? '/' : `/${l}/`);
