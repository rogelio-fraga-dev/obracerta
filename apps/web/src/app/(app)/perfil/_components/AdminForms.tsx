"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, Button, Input, Label } from "@obracerta/ui";
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
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminSchema),
  });

  const onSubmit = (data: CreateAdminInput) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await createAdminAction(data);
        setFeedback({ ok: true, msg: "Administrador criado com sucesso." });
        reset();
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Criando..." : "Criar Administrador"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
