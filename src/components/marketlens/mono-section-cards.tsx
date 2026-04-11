"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

type MonoSectionCardsProps = {
  fullAttention: number;
  partialAttention: number;
  ignored: number;
  total: number;
};

// Adapted from ui-main section-cards composition and hierarchy.
export function MonoSectionCards({
  fullAttention,
  partialAttention,
  ignored,
  total,
}: MonoSectionCardsProps) {
  const safeTotal = Math.max(total, 1);
  const fullPct = Math.round((fullAttention / safeTotal) * 100);
  const partialPct = Math.round((partialAttention / safeTotal) * 100);
  const ignorePct = Math.round((ignored / safeTotal) * 100);
  const score = Math.round((fullPct * 2 + partialPct) / 2);

  const cards = [
    {
      label: "Impact Score",
      value: String(score),
      meta: `${fullPct}% strong alignment`,
      badge: "Signal",
    },
    {
      label: "High Engagement",
      value: String(fullAttention),
      meta: `${fullPct}% of audience`,
      badge: "High",
    },
    {
      label: "Medium Engagement",
      value: String(partialAttention),
      meta: `${partialPct}% of audience`,
      badge: "Medium",
    },
    {
      label: "Critical Objections",
      value: String(ignored),
      meta: `${ignorePct}% rejected`,
      badge: "Objection",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <motion.div
          key={card.label}
          layout
          initial={{ opacity: 0.6, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <Card className="border-white/20 bg-black/40">
            <CardHeader>
              <CardDescription className="text-white/60">{card.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums text-white">
                {card.value}
              </CardTitle>
              <Badge variant="outline" className="w-fit border-white/25 text-white/80">
                {card.badge}
              </Badge>
            </CardHeader>
            <CardFooter className="text-xs text-white/60">{card.meta}</CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

