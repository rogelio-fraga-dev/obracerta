"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, Button, Input, Label } from "@obracerta/ui";
import { AlertTriangle } from "lucide-react";
import { type User, updateProfileSchema, type UpdateProfileInput, updatePasswordSchema, type UpdatePasswordInput, createAdminSchema, type CreateAdminInput } from "@obracerta/shared";
import { updateProfileAction, updatePasswordAction, createAdminAction, uploadFotoAction } from "../actions";

interface AdminFormsProps {
  user: User;
}

/** Estado de feedback inline (substitui os `alert()` nativos — acessível e não bloqueante). */
type Feedback = { ok: boolean; msg: string } | null;

function FormFeedback({ state }: { state: Feedback }) {
  if (!state) return null;
  return (
    <p
      role="alert"
      className={
        state.ok
          ? "rounded-md bg-success/10 px-3 py-2 text-sm font-medium text-success"
          : "rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
      }
    >
      {state.msg}
    </p>
  );
}

export function AdminForms({ user }: AdminFormsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm user={user} />
        <PhotoForm />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <PasswordForm />
        <CreateAdminForm />
      </div>
    </div>
  );
}

function ProfileForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nomeCompleto: user.nomeCompleto,
      email: user.email ?? "",
    }
  });

  const onSubmit = (data: UpdateProfileInput) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await updateProfileAction(data);
        setFeedback({ ok: true, msg: "Perfil atualizado com sucesso." });
      } catch (err) {
        setFeedback({ ok: false, msg: err instanceof Error ? err.message : "Erro ao atualizar perfil." });
      }
    });
  };

  return (
    <Card className="space-y-4">
      <h3 className="font-display text-xl font-bold">Dados Pessoais</h3>
      <FormFeedback state={feedback} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="nomeCompleto">Nome Completo</Label>
          <Input id="nomeCompleto" {...register("nomeCompleto")} />
          {errors.nomeCompleto && <p className="text-sm text-danger">{errors.nomeCompleto.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = (data: UpdatePasswordInput) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await updatePasswordAction(data);
        setFeedback({ ok: true, msg: "Senha atualizada com sucesso." });
        reset();
      } catch (err) {
        setFeedback({ ok: false, msg: err instanceof Error ? err.message : "Erro ao atualizar senha." });
      }
    });
  };

  return (
    <Card className="space-y-4">
      <h3 className="font-display text-xl font-bold">Segurança</h3>
      <FormFeedback state={feedback} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="oldPassword">Senha Atual</Label>
          <Input id="oldPassword" type="password" {...register("oldPassword")} />
          {errors.oldPassword && <p className="text-sm text-danger">{errors.oldPassword.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="newPassword">Nova Senha</Label>
          <Input id="newPassword" type="password" {...register("newPassword")} />
          {errors.newPassword && <p className="text-sm text-danger">{errors.newPassword.message}</p>}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Atualizando..." : "Trocar Senha"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PhotoForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        await uploadFotoAction(formData);
        setFeedback({ ok: true, msg: "Foto atualizada com sucesso." });
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        setFeedback({ ok: false, msg: err instanceof Error ? err.message : "Erro ao atualizar foto." });
      }
    });
  };

  return (
    <Card className="space-y-4">
      <h3 className="font-display text-xl font-bold">Foto de Perfil</h3>
      <FormFeedback state={feedback} />
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="foto">Selecione uma imagem (Máx 5MB)</Label>
          <Input id="foto" type="file" accept="image/png, image/jpeg, image/webp" ref={fileInputRef} />
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={handleUpload} disabled={isPending}>
            {isPending ? "Enviando..." : "Fazer Upload"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CreateAdminForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  // Etapa de confirmação: criar um admin dá **controle total**, então exigimos
  // re-digitar o e-mail do novo admin antes de efetivar — evita criação acidental
  // e adiciona fricção contra automação. (A trava de autorização real é a API.)
  const [pendingAdmin, setPendingAdmin] = useState<CreateAdminInput | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminSchema),
  });

  const onSubmit = (data: CreateAdminInput) => {
    setFeedback(null);
    setConfirmEmail("");
    setPendingAdmin(data); // abre a confirmação em vez de criar direto
  };

  const cancelar = () => {
    setPendingAdmin(null);
    setConfirmEmail("");
  };

  const confirmar = () => {
    if (!pendingAdmin) return;
    if (confirmEmail.trim().toLowerCase() !== pendingAdmin.email.toLowerCase()) {
      setFeedback({ ok: false, msg: "O e-mail não confere. Digite o e-mail do novo admin para confirmar." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      try {
        await createAdminAction(pendingAdmin);
        setFeedback({ ok: true, msg: "Administrador criado com sucesso." });
        reset();
        setPendingAdmin(null);
        setConfirmEmail("");
      } catch (err) {
        setFeedback({ ok: false, msg: err instanceof Error ? err.message : "Erro ao criar administrador." });
      }
    });
  };

  return (
    <Card className="space-y-4 border-primary/20 bg-primary/5">
      <div>
        <h3 className="font-display text-xl font-bold text-primary">Novo Administrador</h3>
        <p className="text-sm text-muted-foreground mt-1">Crie um novo usuário com controle total do sistema.</p>
      </div>
      <FormFeedback state={feedback} />

      {pendingAdmin ? (
        <div className="space-y-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-danger">
            <AlertTriangle aria-hidden className="h-4 w-4 shrink-0" /> Ação sensível: controle total do sistema
          </p>
          <p className="text-sm text-foreground">
            Você vai criar um administrador com acesso a tudo:{" "}
            <span className="font-bold">{pendingAdmin.nomeCompleto}</span> ({pendingAdmin.email}). Para
            confirmar, digite o e-mail dele novamente.
          </p>
          <div className="space-y-1">
            <Label htmlFor="confirmAdminEmail">Confirme o e-mail do novo admin</Label>
            <Input
              id="confirmAdminEmail"
              type="email"
              autoComplete="off"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={pendingAdmin.email}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={cancelar} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar} disabled={isPending || !confirmEmail.trim()}>
              {isPending ? "Criando..." : "Confirmar criação"}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="adminNome">Nome Completo</Label>
            <Input id="adminNome" {...register("nomeCompleto")} />
            {errors.nomeCompleto && <p className="text-sm text-danger">{errors.nomeCompleto.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="adminWhatsapp">WhatsApp</Label>
            <Input id="adminWhatsapp" {...register("whatsapp")} placeholder="+5511999999999" />
            {errors.whatsapp && <p className="text-sm text-danger">{errors.whatsapp.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="adminEmail">E-mail de Login</Label>
            <Input id="adminEmail" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="adminPassword">Senha Provisória</Label>
            <Input id="adminPassword" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit">Revisar e criar</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
