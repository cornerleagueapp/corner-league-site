export const PUBLIC_RACEPOD_ENABLED = false;
export function publicPageAvailable(path: string) {
 const pathname = path.split(/[?#]/)[0].replace(/\/$/, "");
 return !["/racepod", "/racepod-info", "/scores/aqua/racepod", "/admin/racepods"].some(root => pathname === root || pathname.startsWith(root + "/"));
}
