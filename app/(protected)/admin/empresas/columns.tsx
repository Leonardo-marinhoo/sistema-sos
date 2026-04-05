"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Eye, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions, DataTableRowAction } from "@/components/ui/data-table-row-actions"

export type Company = {
  id: string
  name: string
  legal_name: string
  document_number: string
  is_active?: boolean
  created_at: string
}

export const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome Fantasia" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "legal_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Razão Social" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("legal_name")}</div>
    ),
  },
  {
    accessorKey: "document_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CNPJ" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("document_number")}</div>
    ),
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <Badge variant={isActive !== false ? "success" : "destructive"}>
          {isActive !== false ? "Ativa" : "Inativa"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criada em" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {new Date(row.getValue("created_at")).toLocaleDateString("pt-BR")}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const company = row.original
      return (
        <DataTableRowActions>
          <DataTableRowAction asChild>
            <Link href={`/admin/empresas/${company.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </DataTableRowAction>
          <DataTableRowAction asChild>
            <Link href={`/admin/empresas/${company.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DataTableRowAction>
        </DataTableRowActions>
      )
    },
  },
]
