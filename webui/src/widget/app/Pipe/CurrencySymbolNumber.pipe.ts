import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencySymbolNumber'
})

export class CurrencySymbolNumberPipe implements PipeTransform {
  transform(value: any): string {
    return this.getSymbolFromCurrency(value);
  }

  getSymbolFromCurrency(currencyCode) {
    let symbol = this.getCurrencySymbolsJson();
    if (symbol.hasOwnProperty(currencyCode)) {
      return symbol[currencyCode];
    } else {
      return undefined;
    }
  }

  getCurrencySymbolsJson() {
    let currencySymbols = {
      "ALL": "L",
      "AFN": "؋",
      "ARS": "$",
      "AWG": "ƒ",
      "AUD": "$",
      "AZN": "₼",
      "BSD": "$",
      "BBD": "$",
      "BYR": "p.",
      "BZD": "BZ$",
      "BMD": "$",
      "BOB": "Bs.",
      "BAM": "KM",
      "BWP": "P",
      "BGN": "лв",
      "BRL": "R$",
      "BND": "$",
      "KHR": "៛",
      "CAD": "$",
      "KYD": "$",
      "CLP": "$",
      "CNY": "¥",
      "COP": "$",
      "CRC": "₡",
      "HRK": "kn",
      "CUP": "₱",
      "CZK": "Kč",
      "DKK": "kr",
      "DOP": "RD$",
      "XCD": "$",
      "EGP": "£",
      "SVC": "$",
      "EEK": "kr",
      "EUR": "€",
      "FKP": "£",
      "FJD": "$",
      "GHC": "₵",
      "GIP": "£",
      "GTQ": "Q",
      "GGP": "£",
      "GYD": "$",
      "HNL": "L",
      "HKD": "$",
      "HUF": "Ft",
      "ISK": "kr",
      "INR": "₹",
      "IDR": "Rp",
      "IRR": "﷼",
      "IMP": "£",
      "ILS": "₪",
      "JMD": "J$",
      "JPY": "¥",
      "JEP": "£",
      "KES": "KSh",
      "KZT": "лв",
      "KPW": "₩",
      "KRW": "₩",
      "KGS": "лв",
      "LAK": "₭",
      "LVL": "Ls",
      "LBP": "£",
      "LRD": "$",
      "LTL": "Lt",
      "MKD": "ден",
      "MYR": "RM",
      "MUR": "₨",
      "MXN": "$",
      "MNT": "₮",
      "MZN": "MT",
      "NAD": "$",
      "NPR": "₨",
      "ANG": "ƒ",
      "NZD": "$",
      "NIO": "C$",
      "NGN": "₦",
      "NOK": "kr",
      "OMR": "﷼",
      "PKR": "₨",
      "PAB": "B/.",
      "PYG": "Gs",
      "PEN": "S/.",
      "PHP": "₱",
      "PLN": "zł",
      "QAR": "﷼",
      "RON": "lei",
      "RUB": "₽",
      "RMB": "￥",
      "SHP": "£",
      "SAR": "﷼",
      "RSD": "Дин.",
      "SCR": "₨",
      "SGD": "$",
      "SBD": "$",
      "SOS": "S",
      "ZAR": "R",
      "LKR": "₨",
      "SEK": "kr",
      "CHF": "CHF",
      "SRD": "$",
      "SYP": "£",
      "TZS": "TSh",
      "TWD": "NT$",
      "THB": "฿",
      "TTD": "TT$",
      "TRY": "₺",
      "TRL": "₤",
      "TVD": "$",
      "UGX": "USh",
      "UAH": "₴",
      "GBP": "£",
      "USD": "$",
      "UYU": "$U",
      "UZS": "лв",
      "VEF": "Bs",
      "VND": "₫",
      "YER": "﷼",
      "ZWD": "Z$"
    };
    return currencySymbols;
  }

}