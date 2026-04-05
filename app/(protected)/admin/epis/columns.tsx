"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Eye, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions, DataTableRowAction } from "@/components/ui/data-table-row-actions"

export type Epi = {
  id: string
  code: string
  name: string
  category: string
  default_validity_days: number
  company_name?: string | null
  created_at: string
}

export const columnsWithoutCompany: ColumnDef<Epi>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código" />
    ),
    cell: ({ row }) => (
      <div className="font-mono font-medium">{row.getValue("code")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Categoria" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue("category")}</Badge>
    ),
  },
  {
    accessorKey: "default_validity_days",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Validade (dias)" />
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("default_validity_days")}</div>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criado em" />
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
      const epi = row.original
      return (
        <DataTableRowActions>
          <DataTableRowAction asChild>
            <Link href={`/admin/epis/${epi.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </DataTableRowAction>
          <DataTableRowAction asChild>
            <Link href={`/admin/epis/${epi.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DataTableRowAction>
        </DataTableRowActions>
      )
    },
  },
]

export const columns: ColumnDef<Epi>[] = [
  ...columnsWithoutCompany.slice(0, 4),
  {
    accessorKey: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Empresa" />
    ),
    cell: ({ row }) => (
      <div>{row.getValue("company_name") || "-"}</div>
    ),
  },
  ...columnsWithoutCompany.slice(4),
]
