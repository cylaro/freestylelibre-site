"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";

export function Comparison() {
  const specs = [
    { label: "Срок работы", libre2: "14 дней", libre3: "15 дней" },
    { label: "Передача данных", libre2: "NFC (сканирование)", libre3: "Bluetooth (авто)" },
    { label: "Размер датчика", libre2: "35 мм x 5 мм", libre3: "21 мм x 2.9 мм" },
    { label: "Оповещения", libre2: "Есть (Bluetooth)", libre3: "Есть (Bluetooth)" },
    { label: "Точность (MARD)", libre2: "9.3%", libre3: "7.9%" },
    { label: "Приложение", libre2: "LibreLink", libre3: "Libre 3 App" },
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Сравнение поколений</h2>
        <div className="max-w-4xl mx-auto glass overflow-hidden rounded-3xl border shadow-xl">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead className="w-1/3">Характеристика</TableHead>
                <TableHead className="text-center">FreeStyle Libre 2</TableHead>
                <TableHead className="text-center text-primary font-bold">FreeStyle Libre 3 Plus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specs.map((spec, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{spec.label}</TableCell>
                  <TableCell className="text-center">{spec.libre2}</TableCell>
                  <TableCell className="text-center font-semibold text-primary">{spec.libre3}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
