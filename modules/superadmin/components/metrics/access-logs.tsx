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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccessLogs, type AccessLog } from "@/modules/superadmin/lib/api";
import { formatRelativeTime } from "@/modules/superadmin/lib/format";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export function AccessLogsTable() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [action, setAction] = useState<string>("");
  const [searchUser, setSearchUser] = useState<string>("");

  const offset = page * limit;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await getAccessLogs({
          limit,
          offset,
          action: action || undefined,
          userId: searchUser || undefined,
        });
        setLogs(result.data);
        setTotal(result.total);
      } catch (error) {
        console.error("Error loading access logs:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [page, limit, action, searchUser]);

  const totalPages = Math.ceil(total / limit);

  const actionBadgeColor = {
    login: "bg-green-100 text-green-800",
    logout: "bg-gray-100 text-gray-800",
    session_timeout: "bg-yellow-100 text-yellow-800",
  } as Record<string, string>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Log de Acessos</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Rastreamento de logins, logouts e sessões do sistema
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID de usuário..."
                className="pl-10"
                value={searchUser}
                onChange={(e) => {
                  setSearchUser(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>

          <Select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(0);
            }}
            className="w-48"
          >
            <option value="">Todas as ações</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="session_timeout">Timeout de Sessão</option>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Navegador</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Data/Hora</TableHead>
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
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, idx) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm text-muted-foreground">
                      {offset + idx + 1}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">
                        {log.app_users?.full_name || "Usuario"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.app_users?.email || log.user_id.substring(0, 8) + "..."}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline" className="capitalize">
                        {log.app_users?.role || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={actionBadgeColor[log.action]}>
                        {log.action === "login"
                          ? "Login"
                          : log.action === "logout"
                          ? "Logout"
                          : "Timeout"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.device_type === "web"
                        ? "Web"
                        : log.device_type === "mobile"
                        ? "Mobile"
                        : "Tablet"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span title={`${log.browser_name} ${log.browser_version}`}>
                        {log.browser_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.ip_address}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {offset + 1}-{Math.min(offset + limit, total)} de {total} registros
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
