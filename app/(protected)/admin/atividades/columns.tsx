"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Eye, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions, DataTableRowAction } from "@/components/ui/data-table-row-actions"

export type Activity = {
  id: string
  code: string
  title: string
  nr_reference: string
  company_name?: string | null
  created_at: string
}

export const columnsWithoutCompany: ColumnDef<Activity>[] = [
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
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Título" />
    ),
    cell: ({ row }) => (
      <div className="font-medium max-w-[300px] truncate">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "nr_reference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Referência NR" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("nr_reference")}</Badge>
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
      const activity = row.original
      return (
        <DataTableRowActions>
          <DataTableRowAction asChild>
            <Link href={`/admin/atividades/${activity.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </DataTableRowAction>
          <DataTableRowAction asChild>
            <Link href={`/admin/atividades/${activity.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DataTableRowAction>
        </DataTableRowActions>
      )
    },
  },
]

export const columns: ColumnDef<Activity>[] = [
  ...columnsWithoutCompany.slice(0, 3),
  {
    accessorKey: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Empresa" />
    ),
    cell: ({ row }) => (
      <div>{row.getValue("company_name") || "-"}</div>
    ),
  },
  ...columnsWithoutCompany.slice(3),
]
