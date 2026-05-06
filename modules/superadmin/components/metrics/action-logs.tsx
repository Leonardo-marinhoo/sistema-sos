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
import { getActionLogs, type ActionLog } from "@/modules/superadmin/lib/api";
import { formatRelativeTime } from "@/modules/superadmin/lib/format";
import { ChevronLeft, ChevronRight, Search, Eye } from "lucide-react";

export function ActionLogsTable() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [action, setAction] = useState<string>("");
  const [entityType, setEntityType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const offset = page * limit;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await getActionLogs({
          limit,
          offset,
          action: action || undefined,
          entityType: entityType || undefined,
          status: status || undefined,
        });
        setLogs(result.data);
        setTotal(result.total);
      } catch (error) {
        console.error("Error loading action logs:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [page, limit, action, entityType, status]);

  const totalPages = Math.ceil(total / limit);

  const actionColors = {
    create: "bg-blue-100 text-blue-800",
    read: "bg-gray-100 text-gray-800",
    update: "bg-yellow-100 text-yellow-800",
    delete: "bg-red-100 text-red-800",
    approve: "bg-green-100 text-green-800",
    reject: "bg-red-100 text-red-800",
    export: "bg-purple-100 text-purple-800",
    download: "bg-indigo-100 text-indigo-800",
  } as Record<string, string>;

  const statusColors = {
    success: "bg-green-100 text-green-800",
    failure: "bg-red-100 text-red-800",
    denied: "bg-orange-100 text-orange-800",
  } as Record<string, string>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Log de Ações</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico completo de ações realizadas pelos usuários no sistema
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(0);
            }}
            className="w-40"
          >
            <option value="">Todas as ações</option>
            <option value="create">Criar</option>
            <option value="read">Ler</option>
            <option value="update">Atualizar</option>
            <option value="delete">Deletar</option>
            <option value="approve">Aprovar</option>
            <option value="reject">Rejeitar</option>
          </Select>

          <Select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(0);
            }}
            className="w-40"
          >
            <option value="">Todas as entidades</option>
            <option value="epi">EPI</option>
            <option value="epi_delivery">Entrega de EPI</option>
            <option value="epi_exchange">Troca de EPI</option>
            <option value="work_permit">Permissão de Trabalho</option>
            <option value="user">Usuário</option>
            <option value="company">Empresa</option>
          </Select>

          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="w-40"
          >
            <option value="">Todos os status</option>
            <option value="success">Sucesso</option>
            <option value="failure">Falha</option>
            <option value="denied">Negado</option>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="min-w-32">Usuário</TableHead>
                <TableHead className="min-w-20">Ação</TableHead>
                <TableHead className="min-w-24">Entidade</TableHead>
                <TableHead className="min-w-20">Status</TableHead>
                <TableHead className="min-w-32">Descrição</TableHead>
                <TableHead className="min-w-24">Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(limit)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, idx) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell>
                      {log.old_values || log.new_values ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-800"}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.entity_type}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[log.status]}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate">
                      {log.description || "-"}
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

        {/* Expanded row details */}
        {expandedId && (
          <div className="border rounded-lg p-4 bg-muted/30">
            {logs.find((l) => l.id === expandedId) && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {logs.find((l) => l.id === expandedId)?.old_values && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Valores Anteriores</h4>
                      <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-40">
                        {JSON.stringify(
                          logs.find((l) => l.id === expandedId)?.old_values,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                  {logs.find((l) => l.id === expandedId)?.new_values && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Novos Valores</h4>
                      <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-40">
                        {JSON.stringify(
                          logs.find((l) => l.id === expandedId)?.new_values,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
                {logs.find((l) => l.id === expandedId)?.error_message && (
                  <div className="bg-red-50 border border-red-200 p-2 rounded text-sm text-red-700">
                    <strong>Erro:</strong> {logs.find((l) => l.id === expandedId)?.error_message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
