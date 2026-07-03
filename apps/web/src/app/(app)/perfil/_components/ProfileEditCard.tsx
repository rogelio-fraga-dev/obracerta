"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type UpdateProfileInput,
  updateProfileSchema,
  type User,
} from "@obracerta/shared";
import { Button, Card, Field, Input } from "@obracerta/ui";
import { updateProfileAction, uploadFotoAction } from "../actions";

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

/**
 * Edição dos dados básicos da conta (nome, e-mail, foto) — disponível para
 * contratante/empresa (antes só o admin editava o próprio perfil). Reaproveita as
 * Server Actions `updateProfileAction`/`uploadFotoAction`. Feedback inline acessível.
 */
export function ProfileEditCard({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { nomeCompleto: user.nomeCompleto, email: user.email ?? "" },
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

  const onUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setFeedback({ ok: false, msg: "Escolha uma imagem antes de enviar." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ ok: false, msg: "A foto passa de 5MB — escolha uma imagem menor." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        await uploadFotoAction(fd);
        setFeedback({ ok: true, msg: "Foto atualizada com sucesso." });
        if (fileRef.current) fileRef.current.value = "";
      } catch (err) {
        setFeedback({ ok: false, msg: err instanceof Error ? err.message : "Erro ao atualizar foto." });
      }
    });
  };

  return (
    <Card className="space-y-4">
      <h2 className="font-display text-xl font-black text-foreground">Editar perfil</h2>
      <FormFeedback state={feedback} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Nome completo">
          <Input {...register("nomeCompleto")} />
        </Field>
        {errors.nomeCompleto && <p className="text-sm text-danger">{errors.nomeCompleto.message}</p>}
        <Field label="E-mail">
          <Input type="email" {...register("email")} />
        </Field>
        {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>

      <div className="space-y-2 border-t border-border pt-4">
        <Field label="Foto de perfil (máx. 5MB)">
          <Input type="file" accept="image/png, image/jpeg, image/webp" ref={fileRef} />
        </Field>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onUpload} disabled={isPending}>
            {isPending ? "Enviando…" : "Enviar foto"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
