"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Eye, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions, DataTableRowAction } from "@/components/ui/data-table-row-actions"

export type User = {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  company_name?: string | null
  job_name: string | null
  created_at: string
}

export const columnsWithoutCompany: ColumnDef<User>[] = [
  {
    accessorKey: "full_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("full_name")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Perfil" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      const roleLabels: Record<string, string> = {
        employee: "Colaborador",
        safety_technician: "Técnico de Segurança",
        company_admin: "Admin Empresa",
      }
      return (
        <Badge variant="secondary">
          {roleLabels[role] || role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "job_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cargo" />
    ),
    cell: ({ row }) => (
      <div>{row.getValue("job_name") || "Sem cargo"}</div>
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
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? "Ativo" : "Inativo"}
        </Badge>
      )
    },
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
      const user = row.original
      return (
        <DataTableRowActions>
          <DataTableRowAction asChild>
            <Link href={`/admin/usuarios/${user.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </DataTableRowAction>
          <DataTableRowAction asChild>
            <Link href={`/admin/usuarios/${user.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DataTableRowAction>
        </DataTableRowActions>
      )
    },
  },
]

export const columns: ColumnDef<User>[] = [
  ...columnsWithoutCompany.slice(0, 3),
  {
    accessorKey: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Empresa" />
    ),
    cell: ({ row }) => (
      <div>{row.getValue("company_name") || "Global"}</div>
    ),
  },
  ...columnsWithoutCompany.slice(3),
]
