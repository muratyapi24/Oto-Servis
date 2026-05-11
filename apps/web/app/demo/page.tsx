import { redirect } from "next/navigation";

/**
 * /demo → Demo hesabı bilgileriyle /login'e yönlendirir.
 * Demo e-posta ve şifre env'den veya sabit varsayılan değerlerden okunur.
 */
export default function DemoPage() {
  const email = process.env.DEMO_EMAIL ?? "demo@bstoto.com";
  const loginUrl = `/login?demo=1&hint=${encodeURIComponent(email)}`;
  redirect(loginUrl);
}
