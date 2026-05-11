import re, os

base = r"D:\Projeler\Bst_Otoservis\apps\web\lib\actions"

files = [
    "mechanic.actions.ts",
    "appointment.actions.ts",
    "analytics.actions.ts",
    "accounting.actions.ts",
    "bulk-notification.actions.ts",
    "crm.actions.ts",
    "import.actions.ts",
    "invoice.actions.ts",
    "maintenance-plan.actions.ts",
    "notification-provider.actions.ts",
    "notifications.actions.ts",
    "onboarding.actions.ts",
    "payment.actions.ts",
    "preference.actions.ts",
    "purchase-order.actions.ts",
    "quality-check.actions.ts",
    "quote.actions.ts",
    "referral.actions.ts",
    "stock-count.actions.ts",
    "stock-transfer.actions.ts",
    "stock.actions.ts",
    "supplier.actions.ts",
    "template.actions.ts",
    "vehicle.actions.ts",
]

for filename in files:
    filepath = os.path.join(base, filename)
    if not os.path.exists(filepath):
        print(f"SKIP: {filename}")
        continue

    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    original = content

    # Remove old auth import (keep if still needed for other things)
    content = re.sub(r'import \{ auth \} from "@/auth"\n', '', content)
    content = re.sub(r'import \{ auth \} from "@/auth";\n', '', content)

    # Fix duplicate guard imports
    content = re.sub(
        r'(import \{ guardTenantRole, guardTenant \} from "@/lib/guards";\n)+',
        r'import { guardTenantRole, guardTenant } from "@/lib/guards";\n',
        content
    )
    content = re.sub(
        r'(import \{ guardTenant \} from "@/lib/guards";\n)+',
        r'import { guardTenant } from "@/lib/guards";\n',
        content
    )

    # Pattern 1: try block with {return} check + tenantId assignment
    content = re.sub(
        r'(\n(\s+))try \{\n\2  const session = await auth\(\);\n\2  if \(!session\?\.user\?\.tenantId\) \{\n[^\}]+\}\n\2  const tenantId = session\.user\.tenantId;',
        lambda m: f'\n{m.group(2)}const g = await guardTenant();\n{m.group(2)}if ("error" in g) return g;\n{m.group(2)}const {{ tenantId }} = g;\n{m.group(2)}try {{',
        content
    )

    # Pattern 2: try block with single-line return + tenantId assignment
    content = re.sub(
        r'(\n(\s+))try \{\n\2  const session = await auth\(\);\n\2  if \(!session\?\.user\?\.tenantId\) return \{[^}]+\};\n\2  const tenantId = session\.user\.tenantId;',
        lambda m: f'\n{m.group(2)}const g = await guardTenant();\n{m.group(2)}if ("error" in g) return g;\n{m.group(2)}const {{ tenantId }} = g;\n{m.group(2)}try {{',
        content
    )

    # Pattern 3: outside try, single-line return + const tenantId
    content = re.sub(
        r'(\n(\s+))const session = await auth\(\);\n\2if \(!session\?\.user\?\.tenantId\) return \{[^}]+\};\n\2const tenantId = session\.user\.tenantId;',
        lambda m: f'\n{m.group(2)}const g = await guardTenant();\n{m.group(2)}if ("error" in g) return g;\n{m.group(2)}const {{ tenantId }} = g;',
        content
    )

    # Pattern 4: try block with {return} check, no tenantId variable
    content = re.sub(
        r'(\n(\s+))try \{\n\2  const session = await auth\(\);\n\2  if \(!session\?\.user\?\.tenantId\) \{\n[^\}]+\}\n',
        lambda m: f'\n{m.group(2)}const g = await guardTenant();\n{m.group(2)}if ("error" in g) return g;\n{m.group(2)}const {{ tenantId }} = g;\n{m.group(2)}try {{\n',
        content
    )

    # Pattern 5: try block with single-line return, no tenantId variable
    content = re.sub(
        r'(\n(\s+))try \{\n\2  const session = await auth\(\);\n\2  if \(!session\?\.user\?\.tenantId\) return \{[^}]+\};\n',
        lambda m: f'\n{m.group(2)}const g = await guardTenant();\n{m.group(2)}if ("error" in g) return g;\n{m.group(2)}const {{ tenantId }} = g;\n{m.group(2)}try {{\n',
        content
    )

    # Replace remaining session.user.tenantId -> tenantId
    content = content.replace('session.user.tenantId', 'tenantId')

    # Remove remaining standalone auth() calls (without if check) that are now orphaned
    content = re.sub(r'\s*const session = await auth\(\);\n', '\n', content)

    if content != original:
        with open(filepath, "w", encoding="utf-8", newline='') as f:
            f.write(content)
        print(f"UPDATED: {filename}")
    else:
        print(f"UNCHANGED: {filename}")

print("Done.")
