"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Eye, Pencil } from "lucide-react"

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions, DataTableRowAction } from "@/components/ui/data-table-row-actions"

export type Job = {
  id: string
  name: string
  description: string | null
  company_name?: string | null
  created_at: string
}

export const columnsWithoutCompany: ColumnDef<Job>[] = [
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
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Descrição" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground max-w-[300px] truncate">
        {row.getValue("description") || "-"}
      </div>
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
      const job = row.original
      return (
        <DataTableRowActions>
          <DataTableRowAction asChild>
            <Link href={`/admin/cargos/${job.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </DataTableRowAction>
          <DataTableRowAction asChild>
            <Link href={`/admin/cargos/${job.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DataTableRowAction>
        </DataTableRowActions>
      )
    },
  },
]

export const columns: ColumnDef<Job>[] = [
  ...columnsWithoutCompany.slice(0, 2),
  {
    accessorKey: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Empresa" />
    ),
    cell: ({ row }) => (
      <div>{row.getValue("company_name") || "-"}</div>
    ),
  },
  ...columnsWithoutCompany.slice(2),
]
