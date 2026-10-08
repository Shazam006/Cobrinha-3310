import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const source=fs.readFileSync(fileURLToPath(new URL('../dist/service-worker.js',import.meta.url)),'utf8');
const listeners={},cacheData=new Map(),deleted=[];let networkMode='ok',fetches=0,claimed=false,installed=[];
const base='https://example.test/games/snake/';
const cache={async addAll(paths){installed=paths;for(const p of paths)cacheData.set(new URL(p,base).href,new Response('cached:'+p))},async match(url){return cacheData.get(url)?.clone()},async put(url,response){cacheData.set(url,response)}};
const context={URL,Response,Set,Promise,caches:{async open(){return cache},async keys(){return ['cobrinha-3310-static-v1','cobrinha-3310-static-v3','unrelated-app']},async delete(k){deleted.push(k)}},self:{registration:{scope:base},location:{origin:new URL(base).origin},addEventListener(k,f){listeners[k]=f},async skipWaiting(){},clients:{async claim(){claimed=true}}},fetch:async()=>{fetches++;if(networkMode==='offline')throw Error('offline');if(networkMode==='error')return new Response('failure',{status:503});return new Response('fresh')}};
vm.runInNewContext(source,context);
await new Promise((resolve,reject)=>listeners.install({waitUntil:p=>p.then(resolve,reject)}));assert.equal(installed.length,7);
await new Promise((resolve,reject)=>listeners.activate({waitUntil:p=>p.then(resolve,reject)}));assert.deepEqual(deleted,['cobrinha-3310-static-v1']);assert(claimed);
function request(url,mode='cors',method='GET'){let response;listeners.fetch({request:{url,mode,method},respondWith:p=>response=p});return response}
assert.equal(request('https://other.test/icon.png'),undefined);assert.equal(request(base+'other.html'),undefined);assert.equal(request(base+'index.html','cors','POST'),undefined);
assert.equal(await (await request(base+'icons/icon-192.png')).text(),'cached:./icons/icon-192.png');assert.equal(fetches,0);
assert.equal(await (await request(base,'navigate')).text(),'fresh');assert.equal(fetches,1);
networkMode='error';assert.equal(await (await request(base+'index.html','navigate')).text(),'cached:./index.html');
networkMode='offline';assert.equal(await (await request(base+'index.html?version=2','navigate')).text(),'cached:./index.html');assert.equal(await (await request(base,'navigate')).text(),'fresh');
console.log('PASS Service worker: seven assets, subdirectory scope, cache cleanup, ignored external/POST/unknown paths, fresh navigation, HTTP-error and offline fallback.');
