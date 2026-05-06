"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPageAccessStats } from "@/modules/superadmin/lib/api";

type PageAccessRow = { page: string; count: number };

export function PageAccessStats() {
  const [rows, setRows] = useState<PageAccessRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getPageAccessStats({ limit: 20 });
        setRows(data);
      } catch (error) {
        console.error("Error loading page access stats:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Páginas mais acessadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum acesso registrado ainda.</p>
        ) : (
          rows.map((row) => (
            <div key={row.page} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="truncate text-sm">{row.page}</span>
              <Badge variant="secondary">{row.count}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}