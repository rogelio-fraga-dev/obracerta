import { type OtpRequestResult, otpRequestSchema } from "@obracerta/shared";
import { handle, jsonOk, parseBody } from "@/lib/bff";
import { callApi } from "@/lib/server-api";

/** BFF: solicita o OTP. Repassa para a API (público, sem cookie). */
export function POST(request: Request) {
  return handle(async () => {
    const body = await parseBody(request, otpRequestSchema);
    const result = await callApi<OtpRequestResult>("POST", "/auth/otp/request", { body });
    return jsonOk(result);
  });
}
