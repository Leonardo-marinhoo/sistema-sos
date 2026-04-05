import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-new";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSession } from "@/lib/auth/session";
import { createNotification, deleteNotification, markAsRead } from "@/app/(protected)/colaborador/notificacoes/actions";
import { Bell, Send, Trash2, Check, Mail, MailOpen } from "lucide-react";

export default async function NotificationsPage() {
  const { supabase, profile, permissions } = await requireSession();

  const [{ data: notifications }, { data: users }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id,title,message,is_read,created_at")
      .eq("recipient_user_id", profile.id)
      .order("created_at", { ascending: false }),
    permissions.includes("notify-users")
      ? supabase
          .from("app_users")
          .select("id,full_name,email")
          .eq("company_id", profile.company_id)
          .eq("is_active", true)
          .order("full_name")
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string; email: string }> }),
  ]);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Colaborador
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            Central de comunicação e avisos.
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="default" className="h-8 px-3">
            {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        {permissions.includes("notify-users") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Enviar notificação
              </CardTitle>
              <CardDescription>
                Envie uma mensagem para um colaborador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormWithToast 
                action={createNotification} 
                successMessage="Notificação enviada com sucesso!"
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="recipient_user_id">Destinatário</Label>
                  <Select name="recipient_user_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    required
                    name="title"
                    placeholder="Título da notificação"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <textarea
                    id="message"
                    required
                    name="message"
                    placeholder="Digite a mensagem..."
                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <SubmitButton className="w-full" loadingText="Enviando...">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </SubmitButton>
              </FormWithToast>
            </CardContent>
          </Card>
        )}

        <Card className={permissions.includes("notify-users") ? "" : "xl:col-span-2"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Minhas notificações
            </CardTitle>
            <CardDescription>
              Mensagens e avisos recebidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications?.length ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      !notification.is_read ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {notification.is_read ? (
                          <MailOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                        ) : (
                          <Mail className="h-5 w-5 text-primary mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      <Badge variant={notification.is_read ? "secondary" : "default"}>
                        {notification.is_read ? "Lida" : "Nova"}
                      </Badge>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="flex gap-2">
                        {!notification.is_read && (
                          <FormWithToast action={markAsRead} successMessage="Marcada como lida">
                            <input type="hidden" name="id" value={notification.id} />
                            <SubmitButton variant="ghost" size="sm" loadingText="...">
                              <Check className="mr-1 h-4 w-4" />
                              Marcar como lida
                            </SubmitButton>
                          </FormWithToast>
                        )}
                        <FormWithToast action={deleteNotification} successMessage="Notificação excluída">
                          <input type="hidden" name="id" value={notification.id} />
                          <SubmitButton 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            loadingText="..."
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Excluir
                          </SubmitButton>
                        </FormWithToast>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">Nenhuma notificação</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você não tem notificações no momento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
