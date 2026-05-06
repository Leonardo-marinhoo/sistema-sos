"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserActivitySummary, type UserActivitySummary } from "@/modules/superadmin/lib/api";
import { formatRelativeTime } from "@/modules/superadmin/lib/format";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

export function UserActivityTable() {
  const [users, setUsers] = useState<UserActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  const offset = page * limit;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await getUserActivitySummary({
          limit,
          offset,
        });
        setUsers(result.data);
        setTotal(result.total);
      } catch (error) {
        console.error("Error loading user activity:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [page, limit]);

  const totalPages = Math.ceil(total / limit);

  const isInactive = (lastActivityDate: string | null): boolean => {
    if (!lastActivityDate) return true;
    const lastDate = new Date(lastActivityDate);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastDate < thirtyDaysAgo;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Atividade de Usuários</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo de atividades e últimos acessos por usuário
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Table */}
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-40">Usuário</TableHead>
                <TableHead className="min-w-32">Empresa</TableHead>
                <TableHead className="min-w-20">Perfil</TableHead>
                <TableHead className="text-center">Total de Logins</TableHead>
                <TableHead className="text-center">Total de Ações</TableHead>
                <TableHead className="min-w-32">Último Acesso</TableHead>
                <TableHead className="min-w-32">Último Logout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(limit)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, idx) => {
                  const inactive = isInactive(user.last_activity_date);

                  return (
                    <TableRow
                      key={user.id}
                      className={`hover:bg-muted/50 ${inactive ? "bg-yellow-50" : ""}`}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {offset + idx + 1}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          {inactive && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-medium">
                              {(user as any)?.app_users?.full_name || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(user as any)?.app_users?.email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {(user as any)?.app_users?.company?.name || "Super Admin"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className="capitalize">
                          {(user as any)?.app_users?.role || "employee"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {user.total_logins}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {user.total_actions}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_login
                          ? formatRelativeTime(user.last_login)
                          : "Nunca"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_logout
                          ? formatRelativeTime(user.last_logout)
                          : "Nunca"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {offset + 1}-{Math.min(offset + limit, total)} de {total} usuários
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1 || loading}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
