import { readBytesWithLimit } from "./body-limit.ts";
function request(bytes: Uint8Array, length?: string): Request {
 const headers: Record<string,string> = {};
 if(length !== undefined) headers["content-length"] = length;
 return new Request("https://example.invalid/upload", {method:"POST",headers,body:new Blob([new Uint8Array(bytes)])});
}
function bytes(length:number): Uint8Array {
 const a=new Uint8Array(length);a.fill(65);return a;
}
Deno.test("small file accepted and bytes preserved",async()=>{
 const out=await readBytesWithLimit(request(bytes(30)),64);
 if(!out||out.byteLength!==30||out[0]!==65)throw Error("small input should be read");
});
Deno.test("oversize body rejected even when Content-Length absent",async()=>{
 const out=await readBytesWithLimit(request(bytes(65)),64);
 if(out!==null)throw Error("oversize chunked body was buffered");
});
Deno.test("explicit oversized Content-Length fails closed",async()=>{
 if(await readBytesWithLimit(request(bytes(4),"1024"),64)!==null)throw Error("oversized declared length accepted");
});
Deno.test("invalid Content-Length rejected",async()=>{
 if(await readBytesWithLimit(request(bytes(4),"invalid"),64)!==null)throw Error("invalid declared length accepted");
});
Deno.test("missing body rejected",async()=>{
 const req=new Request("https://example.invalid/upload",{method:"POST"});
 if(await readBytesWithLimit(req,64)!==null)throw Error("empty request unexpectedly accepted");
});
Deno.test("limit must be positive safe integer",async()=>{
 if(await readBytesWithLimit(request(bytes(4)),0)!==null)throw Error("bad limit accepted");
});
Deno.test("true chunked stream crossing limit is denied",async()=>{
 const stream=new ReadableStream<Uint8Array>({
  start(ctrl){ctrl.enqueue(bytes(40));ctrl.enqueue(bytes(40));ctrl.close();}
 });
 const req=new Request("https://example.invalid/upload",{method:"POST",body:stream,duplex:"half"} as RequestInit);
 const result=await readBytesWithLimit(req,64);
 if(result!==null)throw Error("streaming body escaped upper bound");
});
