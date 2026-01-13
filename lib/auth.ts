export const getAdminAllowlist = () => {
  const list = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return list
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

export const isAdminEmail = (email?: string | null) => {
  if (!email) {
    return false;
  }
  const allowlist = getAdminAllowlist();
  return allowlist.includes(email.toLowerCase());
};
