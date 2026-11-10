"use strict";
/** Rebuild first-party VOR-006 draft notices for the VOR-012 offline demo. */
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const src=fs.readFileSync(path.join(root,"backend/customer-identity/notices.ts"),"utf8");
const version=src.match(/export const NOTICE_VERSION="[^"]+";/)?.[0];
const from=src.indexOf("export const NOTICES:");
const to=src.indexOf("export const PURPOSES=");
if(!version||from<0||to<=from)throw Error("Unexpected VOR-006 notice registry structure");
const copy=src.slice(from,to);
if(!copy.includes("privacy_acknowledgement")||!copy.includes("terms_acknowledgement"))throw Error("Missing consent notice");
const output="// GENERATED from backend/customer-identity/notices.ts by scripts/build_vyn_coach_notices.cjs\n// Never hand-edit; source texts are unapproved synthetic notices.\n"+
 version+"\n"+copy.replace("export const NOTICES:Record<Purpose,Record<Language,string>>=","export const NOTICES=");
const target=path.join(root,"assets/vyn-coach-notices.js");
if(process.argv.includes("--check")){
 if(fs.readFileSync(target,"utf8")!==output)throw Error("VOR-012 browser notice registry differs from canonical VOR-006 source");
 console.log("PASS: Vyn Coach notices exactly match VOR-006 unapproved source");
}else{
 fs.writeFileSync(target,output);console.log("Generated "+path.relative(root,target));
}
