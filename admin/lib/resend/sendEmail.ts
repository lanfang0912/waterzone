import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("Missing RESEND_API_KEY");
    _resend = new Resend(key);
  }
  return _resend;
}

type SendEmailOptions = {
  to: string;
  name: string;
  subject: string;
  body: string;
};

export async function sendSubscribeEmail(opts: SendEmailOptions): Promise<{ id?: string }> {
  const resend = getResend();

  const from = `${process.env.RESEND_FROM_NAME ?? "Urland"} <${process.env.RESEND_FROM_EMAIL ?? "noreply@send.urland.com.tw"}>`;

  // body 若含 HTML tag 就直接用，否則轉成簡單 HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(opts.body);
  const html = isHtml
    ? opts.body
    : opts.body
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("");

  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html,
  });

  if (error) throw new Error(error.message);
  return { id: data?.id };
}

// 後台「重寄」用
export async function resendEmail(opts: SendEmailOptions): Promise<{ id?: string }> {
  return sendSubscribeEmail(opts);
}
