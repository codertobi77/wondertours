"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CurrencyCode, SUPPORTED_CURRENCIES, EXCHANGE_RATES_TO_XOF } from "@/lib/format";

type CurrencyContextType = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  rates: Record<string, number>;
  convert: (amount: number, from: string, to: string) => number;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("XOF");
  const [rates, setRates] = useState<Record<string, number>>({ ...EXCHANGE_RATES_TO_XOF });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/exchange-rates", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (cancelled || !result?.rates) return;
        setRates((prev) => ({ ...prev, ...result.rates }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const convert = (amount: number, from: string, to: string): number => {
    const fromRate = rates[(from ?? "XOF").toUpperCase()] ?? EXCHANGE_RATES_TO_XOF[(from?.toUpperCase() as CurrencyCode)] ?? 1;
    const toRate = rates[(to ?? "XOF").toUpperCase()] ?? EXCHANGE_RATES_TO_XOF[(to?.toUpperCase() as CurrencyCode)] ?? 1;
    if (!toRate) return amount;
    return (amount * fromRate) / toRate;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

export { SUPPORTED_CURRENCIES };
